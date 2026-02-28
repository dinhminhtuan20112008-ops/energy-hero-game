// Game State
let gameState = {
    totalStars: 0,
    completedTasks: [],
    heroLevel: 'Học Viên',
    achievements: [],
    dailyTasksCompleted: 0
};

const GAME_STATE_STORAGE_KEY = 'energyHeroGameState';
const CUSTOM_TASKS_STORAGE_KEY = 'energyHeroCustomTasks';

let customTasks = [];
let lastAddedTaskId = null;
let editingTaskId = null;

// Task Definitions
const allTasks = [
    {
        id: 1,
        icon: '💡',
        title: 'Tắt đèn khi ra khỏi phòng',
        description: 'Giúp tiết kiệm điện năng',
        stars: 1,
        color: 'from-yellow-400 to-orange-500'
    },
    {
        id: 2,
        icon: '🔌',
        title: 'Rút sạc khi không sử dụng',
        description: 'Tránh lãng phí điện',
        stars: 1,
        color: 'from-blue-400 to-cyan-500'
    },
    {
        id: 3,
        icon: '🚿',
        title: 'Tắt vòi nước khi đánh răng',
        description: 'Tiết kiệm nước sạch',
        stars: 1,
        color: 'from-cyan-400 to-blue-500'
    },
    {
        id: 4,
        icon: '🌞',
        title: 'Dùng ánh sáng tự nhiên',
        description: 'Mở cửa sổ thay vì bật đèn',
        stars: 2,
        color: 'from-yellow-300 to-yellow-500'
    },
    {
        id: 5,
        icon: '🚲',
        title: 'Đi bộ hoặc đi xe đạp',
        description: 'Giảm khí thải CO2',
        stars: 2,
        color: 'from-green-400 to-emerald-500'
    },
    {
        id: 6,
        icon: '🌳',
        title: 'Trồng và chăm sóc cây xanh',
        description: 'Làm không khí trong lành',
        stars: 3,
        color: 'from-green-500 to-teal-500'
    },
    {
        id: 7,
        icon: '♻️',
        title: 'Phân loại rác',
        description: 'Tái chế bảo vệ môi trường',
        stars: 2,
        color: 'from-purple-400 to-pink-500'
    },
    {
        id: 8,
        icon: '📱',
        title: 'Giảm thời gian dùng thiết bị điện tử',
        description: 'Tiết kiệm năng lượng và bảo vệ mắt',
        stars: 2,
        color: 'from-indigo-400 to-purple-500'
    },
    {
        id: 9,
        icon: '🌡️',
        title: 'Điều hòa nhiệt độ hợp lý',
        description: 'Đặt 26°C vào mùa hè',
        stars: 2,
        color: 'from-red-400 to-orange-500'
    }
];

// Hero Levels
const heroLevels = [
    { name: 'Học Viên', minStars: 0, maxStars: 5 },
    { name: 'Bảo Vệ Môi Trường', minStars: 5, maxStars: 15 },
    { name: 'Chiến Binh Xanh', minStars: 15, maxStars: 25 },
    { name: 'Đại Sứ Năng Lượng', minStars: 25, maxStars: 35 },
    { name: 'Thần Năng Lượng', minStars: 35, maxStars: 50 },
    { name: 'Huyền Thoại Xanh', minStars: 50, maxStars: 50 }
];

// Achievements
const achievements = [
    { id: 1, icon: '🌟', title: 'Ngôi Sao Đầu Tiên', description: 'Hoàn thành nhiệm vụ đầu tiên', condition: () => gameState.totalStars >= 1 },
    { id: 2, icon: '🔥', title: 'Cháy Hết Mình', description: 'Hoàn thành 3 nhiệm vụ trong ngày', condition: () => gameState.dailyTasksCompleted >= 3 },
    { id: 3, icon: '💚', title: 'Bảo Vệ Môi Trường', description: 'Đạt 5 ngôi sao', condition: () => gameState.totalStars >= 5 },
    { id: 4, icon: '⚔️', title: 'Chiến Binh Xanh', description: 'Đạt 15 ngôi sao', condition: () => gameState.totalStars >= 15 },
    { id: 5, icon: '🏆', title: 'Đại Sứ Năng Lượng', description: 'Đạt 25 ngôi sao', condition: () => gameState.totalStars >= 25 },
    { id: 6, icon: '⚡', title: 'Thần Năng Lượng', description: 'Đạt 35 ngôi sao', condition: () => gameState.totalStars >= 35 },
    { id: 7, icon: '👑', title: 'Huyền Thoại Xanh', description: 'Đạt 50 ngôi sao - TỐI ĐA!', condition: () => gameState.totalStars >= 50 },
    { id: 8, icon: '🌈', title: 'Hoàn Hảo', description: 'Hoàn thành tất cả nhiệm vụ trong ngày', condition: () => gameState.dailyTasksCompleted >= 6 }
];

// Initialize Game
function initGame() {
    loadCustomTasks();
    loadGameState();
    updateHeroLevel();
    updateUI();
    checkAchievements();
}

function getAllTasks() {
    return [...allTasks, ...customTasks];
}

function isCustomTaskId(taskId) {
    return customTasks.some(t => t.id === taskId);
}

function normalizeTasksAfterCustomTaskChange(previousTaskById) {
    if (!previousTaskById) return;

    if (gameState.completedTasks.includes(previousTaskById.id)) {
        const latest = getAllTasks().find(t => t.id === previousTaskById.id);
        if (latest) {
            const diff = (latest.stars || 0) - (previousTaskById.stars || 0);
            if (diff !== 0) {
                gameState.totalStars = Math.max(0, (gameState.totalStars || 0) + diff);
            }
        }
        updateHeroLevel();
        saveGameState();
    }
}

// Generate Daily Tasks
function generateDailyTasks() {
    const tasksContainer = document.getElementById('tasksContainer');
    tasksContainer.innerHTML = '';
    
    // Select 6 random tasks for today
    const pool = getAllTasks();
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const dailyTasks = shuffled.slice(0, Math.min(6, shuffled.length));

    if (lastAddedTaskId != null) {
        const hasNew = dailyTasks.some(t => t.id === lastAddedTaskId);
        const newTask = pool.find(t => t.id === lastAddedTaskId);
        if (!hasNew && newTask) {
            dailyTasks[dailyTasks.length ? dailyTasks.length - 1 : 0] = newTask;
        }
        lastAddedTaskId = null;
    }
    
    dailyTasks.forEach(task => {
        const isCompleted = gameState.completedTasks.includes(task.id);
        const taskCard = createTaskCard(task, isCompleted);
        tasksContainer.appendChild(taskCard);
    });
}

// Create Task Card
function createTaskCard(task, isCompleted) {
    const card = document.createElement('div');
    card.className = `task-card bg-white rounded-xl p-6 shadow-lg cursor-pointer ${
        isCompleted ? 'completed-task opacity-75' : 'hover:shadow-xl'
    }`;

    const customActions = isCustomTaskId(task.id)
        ? `
            <div class="flex justify-center space-x-2 mb-3">
                <button onclick="editCustomTask(${task.id})" class="px-3 py-1 rounded-lg text-sm font-semibold bg-white/80 hover:bg-white text-purple-700 border border-purple-200">
                    <i class="fas fa-pen mr-1"></i>Sửa
                </button>
                <button onclick="deleteCustomTask(${task.id})" class="px-3 py-1 rounded-lg text-sm font-semibold bg-white/80 hover:bg-white text-red-600 border border-red-200">
                    <i class="fas fa-trash mr-1"></i>Xóa
                </button>
            </div>
        `
        : '';
    
    card.innerHTML = `
        <div class="text-center">
            ${customActions}
            <div class="text-5xl mb-3 ${isCompleted ? 'grayscale' : ''}">${task.icon}</div>
            <h3 class="font-bold text-gray-800 mb-2">${task.title}</h3>
            <p class="text-sm text-gray-600 mb-4">${task.description}</p>
            <div class="flex justify-center items-center space-x-1 mb-4">
                ${Array(task.stars).fill('').map(() => '<span class="text-yellow-400">⭐</span>').join('')}
            </div>
            <button 
                onclick="completeTask(${task.id})" 
                class="w-full py-2 px-4 rounded-lg font-bold transition-all ${
                    isCompleted 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : `bg-gradient-to-r ${task.color} text-white hover:scale-105`
                }"
                ${isCompleted ? 'disabled' : ''}>
                ${isCompleted ? '✓ Đã hoàn thành' : 'Hoàn thành'}
            </button>
        </div>
    `;
    
    return card;
}

// Complete Task
function completeTask(taskId) {
    if (gameState.completedTasks.includes(taskId)) return;
    
    const task = getAllTasks().find(t => t.id === taskId);
    if (!task) return;
    
    console.log("🎉 Completing task:", task.title, "Stars:", task.stars);
    
    // Play sound IMMEDIATELY when task is clicked
    console.log("🔊 Playing success sound...");
    playSuccessSound();
    
    // Update game state
    gameState.completedTasks.push(taskId);
    gameState.totalStars += task.stars;
    gameState.dailyTasksCompleted++;
    
    console.log("⭐ New total stars:", gameState.totalStars);
    
    // Update hero level
    updateHeroLevel();
    
    // Save state
    saveGameState();
    
    // Show success modal
    showSuccessModal(task);
    
    // Update UI
    updateUI();
    
    // IMMEDIATE ACHIEVEMENT CHECK - no delay
    console.log("🏆 CHECKING ACHIEVEMENTS IMMEDIATELY...");
    checkAchievements();
    
    // FORCE UNLOCK if we have stars
    if (gameState.totalStars >= 1) {
        console.log("🔥 FORCE UNLOCKING FIRST ACHIEVEMENT!");
        console.log("🔍 DEBUG: Total stars =", gameState.totalStars);
        console.log("🔍 DEBUG: About to call forceAchievementUnlock(1)");
        
        // Call immediately without timeout
        forceAchievementUnlock(1);
    }
    
    console.log("✅ Task completion finished");
}

// Force unlock specific achievement (for testing)
function forceAchievementUnlock(achievementId) {
    console.log("🚀 STARTING forceAchievementUnlock with ID:", achievementId);
    
    const achievementsContainer = document.getElementById('achievementsContainer');
    console.log("🔍 DEBUG: achievementsContainer found:", !!achievementsContainer);
    
    if (!achievementsContainer) {
        console.log("❌ ERROR: achievementsContainer not found!");
        return;
    }
    
    console.log("🔍 DEBUG: Container children count:", achievementsContainer.children.length);
    
    const achievement = achievements.find(a => a.id === achievementId);
    console.log("🔍 DEBUG: Achievement found:", !!achievement);
    if (achievement) {
        console.log("🔍 DEBUG: Achievement title:", achievement.title);
    }
    
    if (!achievement) {
        console.log("❌ ERROR: Achievement not found!");
        return;
    }
    
    console.log(`🔥 FORCE UNLOCKING: ${achievement.title}`);
    
    // Get the first achievement card
    const firstCard = achievementsContainer.children[0];
    console.log("🔍 DEBUG: First card found:", !!firstCard);
    
    if (!firstCard) {
        console.log("❌ ERROR: No first achievement card found!");
        console.log("🔍 DEBUG: Container HTML:", achievementsContainer.innerHTML.substring(0, 200));
        return;
    }
    
    console.log("🎯 FOUND FIRST CARD, APPLYING DIRECT CHANGES...");
    console.log("🔍 DEBUG: Original card classes:", firstCard.className);
    console.log("🔍 DEBUG: Original card HTML:", firstCard.innerHTML);
    
    // REMOVE ALL TAILWIND CLASSES
    firstCard.className = '';
    firstCard.removeAttribute('class');
    console.log("✅ Removed all classes");
    
    // DIRECT INLINE STYLES - NO CSS CLASSES
    firstCard.style.cssText = `
        background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%) !important;
        border: 3px solid #f59e0b !important;
        border-radius: 10px !important;
        padding: 18px !important;
        text-align: center !important;
        transform: scale(1.05) !important;
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4) !important;
        position: relative !important;
        z-index: 9999 !important;
        animation: gentleBounce 2s ease-in-out infinite !important;
        filter: brightness(1.1) !important;
    `;
    console.log("✅ Applied card styles");
    
    // GET AND MODIFY CHILD ELEMENTS DIRECTLY
    const icon = firstCard.querySelector('div');
    const title = firstCard.querySelector('h4');
    const desc = firstCard.querySelector('p');
    
    console.log("🔍 DEBUG: Icon found:", !!icon);
    console.log("🔍 DEBUG: Title found:", !!title);
    console.log("🔍 DEBUG: Description found:", !!desc);
    
    if (icon) {
        icon.className = '';
        icon.removeAttribute('class');
        icon.style.cssText = `
            font-size: 32px !important;
            display: block !important;
            color: #f59e0b !important;
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.6)) !important;
            animation: gentlePulse 1.5s ease-in-out infinite !important;
            transform: scale(1.1) !important;
        `;
        console.log("✅ Modified icon");
    }
    
    if (title) {
        title.className = '';
        title.removeAttribute('class');
        title.style.cssText = `
            color: #92400e !important;
            font-weight: 700 !important;
            font-size: 16px !important;
            text-shadow: 1px 1px 3px rgba(245, 158, 11, 0.4) !important;
            margin: 8px 0 !important;
        `;
        console.log("✅ Modified title");
    }
    
    if (desc) {
        desc.className = '';
        desc.removeAttribute('class');
        desc.style.cssText = `
            color: #b45309 !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            text-shadow: 1px 1px 2px rgba(245, 158, 11, 0.3) !important;
        `;
        console.log("✅ Modified description");
    }
    
    // ADD NICE BADGE
    const badge = document.createElement('div');
    badge.style.cssText = `
        background: linear-gradient(45deg, #f59e0b, #fbbf24) !important;
        color: white !important;
        padding: 6px 14px !important;
        border-radius: 15px !important;
        font-weight: 600 !important;
        font-size: 12px !important;
        margin-top: 8px !important;
        animation: gentlePulse 2s ease-in-out infinite !important;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4) !important;
        border: 2px solid #f59e0b !important;
    `;
    badge.textContent = '✅ ĐÃ MỞ KHÓA!';
    firstCard.appendChild(badge);
    
    // Add gentle animations
    const animStyle = document.createElement('style');
    animStyle.textContent = `
        @keyframes gentleBounce {
            0%, 100% { transform: scale(1.05) translateY(0); }
            50% { transform: scale(1.08) translateY(-3px); }
        }
        @keyframes gentlePulse {
            0%, 100% { transform: scale(1.1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.9; }
        }
    `;
    document.head.appendChild(animStyle);
    
    console.log("🎉 SUCCESS: Achievement modified with GENTLE styles!");
    console.log("🔥 All classes removed, gentle styles applied!");
    console.log("🔍 DEBUG: Final card HTML:", firstCard.innerHTML);
    
    // Show notification
    showAchievementUnlockNotification(achievement);
    
    // GENTLE FLASH EFFECT
    document.body.style.transition = 'background-color 0.3s';
    document.body.style.backgroundColor = '#fef3c7';
    setTimeout(() => {
        document.body.style.backgroundColor = '#fed7aa';
        setTimeout(() => {
            document.body.style.backgroundColor = '';
        }, 200);
    }, 200);
    
    console.log("🌈 Gentle flash effect activated!");
}

// Update Hero Level
function updateHeroLevel() {
    const previousLevel = gameState.heroLevel;
    
    for (let i = heroLevels.length - 1; i >= 0; i--) {
        if (gameState.totalStars >= heroLevels[i].minStars) {
            gameState.heroLevel = heroLevels[i].name;
            break;
        }
    }
    
    // Check if leveled up to 5 stars (Bảo Vệ Môi Trường) - Show victory celebration
    if (previousLevel !== 'Bảo Vệ Môi Trường' && gameState.heroLevel === 'Bảo Vệ Môi Trường') {
        console.log("🎉 Reached 5 stars! Showing victory celebration!");
        setTimeout(() => showVictoryModal(), 1000);
    }
    
    // Check if leveled up to Super Hero (50 stars) - Ultimate victory
    if (previousLevel !== 'Huyền Thoại Xanh' && gameState.heroLevel === 'Huyền Thoại Xanh') {
        console.log("👑 Reached 50 stars! ULTIMATE VICTORY!");
        setTimeout(() => showVictoryModal(), 1000);
    }
}

// Update UI
function updateUI() {
    console.log("Updating UI with:", gameState);
    
    // Update stars
    const starsElement = document.getElementById('totalStars');
    if (starsElement) {
        starsElement.textContent = gameState.totalStars;
        console.log("Stars updated to:", gameState.totalStars);
    }
    
    // Update hero level
    const heroLevelElement = document.getElementById('heroLevel');
    if (heroLevelElement) {
        heroLevelElement.textContent = gameState.heroLevel;
        console.log("Hero level updated to:", gameState.heroLevel);
    }
    
    // Update progress bars
    updateProgressBars();
    
    // Refresh tasks
    generateDailyTasks();
    
    // Force a repaint to ensure visual updates
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
}

// Update Progress Bars
function updateProgressBars() {
    const progressData = [
        { id: 'progress1', stars: 0, total: 5 },
        { id: 'progress2', stars: 5, total: 15 },
        { id: 'progress3', stars: 15, total: 25 },
        { id: 'progress4', stars: 25, total: 35 },
        { id: 'progress5', stars: 35, total: 50 }
    ];
    
    progressData.forEach(progress => {
        const element = document.getElementById(progress.id);
        if (element) {
            const percentage = Math.min(100, Math.max(0, 
                ((gameState.totalStars - progress.stars) / (progress.total - progress.stars)) * 100
            ));
            element.style.width = `${percentage}%`;
        } else {
            console.log(`⚠️ Progress element ${progress.id} not found`);
        }
    });
}

// Show Success Modal
function showSuccessModal(task) {
    const modal = document.getElementById('successModal');
    const modalContent = document.getElementById('modalContent');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    setTimeout(() => {
        modalContent.classList.remove('scale-0');
        modalContent.classList.add('scale-100');
    }, 100);
}

// Show Victory Modal
function showVictoryModal() {
    const modal = document.getElementById('victoryModal');
    const modalContent = document.getElementById('victoryModalContent');
    const finalStarsElement = document.getElementById('finalStars');
    
    // Set final stars
    finalStarsElement.textContent = gameState.totalStars;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Play victory sound
    playVictorySound();
    
    // Create confetti effect
    createConfetti();
    
    setTimeout(() => {
        modalContent.classList.remove('scale-0');
        modalContent.classList.add('scale-100');
    }, 100);
}

// Close Victory Modal
function closeVictoryModal() {
    const modal = document.getElementById('victoryModal');
    const modalContent = document.getElementById('victoryModalContent');
    
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// Create Confetti Effect
function createConfetti() {
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = `fall ${2 + Math.random() * 3}s linear`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 50);
    }
}

// Play Victory Sound
function playVictorySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a triumphant melody
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                try {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.8);
                } catch (error) {
                    console.log("Victory sound note failed");
                }
            }, index * 200);
        });
        
        // Visual celebration effect
        document.body.style.animation = 'pulse 0.5s ease-in-out 3';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 1500);
        
    } catch (error) {
        console.log("Victory sound not available");
        
        // Visual celebration effect
        document.body.style.animation = 'pulse 0.5s ease-in-out 3';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 1500);
        
        // Play victory sound with data URI
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    }
}

// Add falling animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    @keyframes floatUp {
        0% { 
            transform: translateY(0) scale(0); 
            opacity: 1; 
        }
        50% { 
            transform: translateY(-50px) scale(1.5); 
            opacity: 1; 
        }
        100% { 
            transform: translateY(-150px) scale(0.5); 
            opacity: 0; 
        }
    }
    .task-card {
        transition: all 0.3s ease;
        transform-style: preserve-3d;
        cursor: pointer;
    }
    
    .task-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .star-burst {
        animation: starBurst 0.6s ease-out;
    }
    
    @keyframes starBurst {
        0% { transform: scale(0) rotate(0deg); opacity: 0; }
        50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
        100% { transform: scale(1) rotate(360deg); opacity: 1; }
    }
    
    .bounce {
        animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-20px); }
        60% { transform: translateY(-10px); }
    }
    
    .completed-task {
        background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%) !important;
        position: relative;
        overflow: hidden;
    }
    
    .completed-task::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem;
        color: white;
        opacity: 0.3;
    }
    
    .hero-badge {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(245, 87, 108, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(245, 87, 108, 0); }
        100% { box-shadow: 0 0 0 0 rgba(245, 87, 108, 0); }
    }
    
    /* Achievement Styles - FORCE OVERRIDE */
    .achievement-locked {
        background-color: #f3f4f6 !important;
        opacity: 1 !important;
        border: 1px solid #d1d5db !important;
        border-radius: 8px !important;
        padding: 16px !important;
        text-align: center !important;
    }
    
    .achievement-unlocked {
        background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%) !important;
        border: 2px solid #f59e0b !important;
        border-radius: 8px !important;
        padding: 16px !important;
        text-align: center !important;
        transform: scale(1.05) !important;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3) !important;
    }
    
    .achievement-icon-locked {
        filter: none !important;
        opacity: 1 !important; /* Ensure full visibility */
        color: #1f2937 !important; /* Very dark grey for maximum visibility */
        font-size: 28px !important;
        margin-bottom: 8px !important;
        display: block !important;
    }
    
    .achievement-icon-unlocked {
        filter: none !important;
        opacity: 1 !important;
        color: #f59e0b !important;
        animation: pulse 2s infinite !important;
        font-size: 28px !important;
        margin-bottom: 8px !important;
        display: block !important;
    }
    
    .achievement-title-locked {
        color: #111827 !important; /* Almost black for maximum contrast */
        font-weight: bold !important;
        font-size: 14px !important;
        margin-bottom: 4px !important;
    }
    
    .achievement-title-unlocked {
        color: #92400e !important;
        font-weight: bold !important;
        font-size: 14px !important;
        margin-bottom: 4px !important;
    }
    
    .achievement-desc-locked {
        color: #374151 !important; /* Darker grey */
        font-size: 12px !important;
    }
    
    .achievement-desc-unlocked {
        color: #b45309 !important;
        font-size: 12px !important;
    }
    
    .achievement-unlock-badge {
        color: #16a34a !important;
        font-weight: bold !important;
        font-size: 10px !important;
        margin-top: 4px !important;
    }
`;
document.head.appendChild(style);

// Close Modal
function closeModal() {
    const modal = document.getElementById('successModal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-0');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// Check Achievements
function checkAchievements() {
    console.log("=== CHECKING ACHIEVEMENTS ===");
    console.log("Current stars:", gameState.totalStars);
    console.log("Daily tasks completed:", gameState.dailyTasksCompleted);
    console.log("Previous achievements:", gameState.achievements);
    
    const achievementsContainer = document.getElementById('achievementsContainer');
    if (!achievementsContainer) {
        console.log("❌ Achievements container not found!");
        return;
    }
    
    // Clear and recreate all achievements
    achievementsContainer.innerHTML = '';
    
    achievements.forEach((achievement, index) => {
        const isUnlocked = achievement.condition();
        const wasPreviouslyUnlocked = gameState.achievements.includes(achievement.id);
        
        console.log(`🏆 Achievement "${achievement.title}":`);
        console.log(`   Condition result: ${isUnlocked}`);
        console.log(`   Was unlocked: ${wasPreviouslyUnlocked}`);
        console.log(`   Condition function: ${achievement.condition.toString()}`);
        
        if (isUnlocked && !wasPreviouslyUnlocked) {
            gameState.achievements.push(achievement.id);
            saveGameState();
            console.log(`🎉 NEW ACHIEVEMENT UNLOCKED: ${achievement.title}`);
            
            // Show unlock notification
            showAchievementUnlockNotification(achievement);
        }
        
        const achievementCard = createAchievementCard(achievement, isUnlocked);
        achievementsContainer.appendChild(achievementCard);
        
        console.log(`   Card created with class: ${achievementCard.className}`);
        
        // Add entrance animation for newly unlocked
        if (isUnlocked && !wasPreviouslyUnlocked) {
            setTimeout(() => {
                achievementCard.classList.add('animate-bounce');
                setTimeout(() => {
                    achievementCard.classList.remove('animate-bounce');
                }, 1000);
            }, 100);
        }
    });
    
    console.log("✅ Achievements check completed");
    console.log(`📊 Container now has ${achievementsContainer.children.length} children`);
}

// Show achievement unlock notification
function showAchievementUnlockNotification(achievement) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
        z-index: 10000;
        font-weight: bold;
        animation: slideInRight 0.5s ease-out;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${achievement.icon}</span>
            <div>
                <div>🎉 Thành Tích Mới!</div>
                <div style="font-size: 14px; opacity: 0.9;">${achievement.title}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
    
    // Add animation CSS
    if (!document.querySelector('#notificationAnimations')) {
        const style = document.createElement('style');
        style.id = 'notificationAnimations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create Achievement Card
function createAchievementCard(achievement, isUnlocked) {
    const card = document.createElement('div');
    
    console.log(`🎨 Creating card for "${achievement.title}", unlocked: ${isUnlocked}`);
    
    // Force direct inline styles to override everything
    if (isUnlocked) {
        card.style.cssText = `
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%) !important;
            border: 2px solid #f59e0b !important;
            border-radius: 8px !important;
            padding: 16px !important;
            text-align: center !important;
            transform: scale(1.05) !important;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3) !important;
            transition: all 0.3s ease !important;
        `;
        
        card.innerHTML = `
            <div style="
                font-size: 28px !important;
                margin-bottom: 8px !important;
                display: block !important;
                color: #f59e0b !important;
                filter: none !important;
                opacity: 1 !important;
                animation: pulse 2s infinite !important;
            ">${achievement.icon}</div>
            <div style="
                color: #92400e !important;
                font-weight: bold !important;
                font-size: 14px !important;
                margin-bottom: 4px !important;
            ">${achievement.title}</div>
            <div style="
                color: #b45309 !important;
                font-size: 12px !important;
            ">${achievement.description}</div>
            <div style="
                color: #16a34a !important;
                font-weight: bold !important;
                font-size: 10px !important;
                margin-top: 4px !important;
            ">✓ ĐÃ MỞ KHÓA</div>
        `;
        
        console.log("✅ Applied UNLOCKED styles");
        
    } else {
        card.style.cssText = `
            background-color: #f3f4f6 !important;
            opacity: 1 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
            padding: 16px !important;
            text-align: center !important;
            transition: all 0.3s ease !important;
        `;
        
        card.innerHTML = `
            <div style="
                font-size: 28px !important;
                margin-bottom: 8px !important;
                display: block !important;
                color: #1f2937 !important;
                filter: none !important;
                opacity: 1 !important;
            ">${achievement.icon}</div>
            <div style="
                color: #111827 !important;
                font-weight: bold !important;
                font-size: 14px !important;
                margin-bottom: 4px !important;
            ">${achievement.title}</div>
            <div style="
                color: #374151 !important;
                font-size: 12px !important;
            ">${achievement.description}</div>
        `;
        
        console.log("🔒 Applied LOCKED styles");
    }
    
    console.log(`📋 Final card HTML: ${card.innerHTML.substring(0, 100)}...`);
    console.log(`🎨 Card styles: ${card.style.cssText.substring(0, 100)}...`);
    
    return card;
}

// Reset Daily Tasks
function resetDailyTasks() {
    if (confirm('Bạn có chắc muốn làm mới nhiệm vụ hôm nay? Tiến độ hôm nay sẽ bị mất!')) {
        gameState.completedTasks = [];
        gameState.dailyTasksCompleted = 0;
        saveGameState();
        generateDailyTasks();
        updateUI();
    }
}

// Save Game State
function saveGameState() {
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(gameState));
}

// Load Game State
function loadGameState() {
    const saved = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        gameState = {
            totalStars: 0,
            completedTasks: [],
            heroLevel: 'Học Viên',
            achievements: [],
            dailyTasksCompleted: 0,
            ...parsed
        };
    } catch (e) {
        console.log('Failed to parse saved game state');
    }
}

function saveCustomTasks() {
    localStorage.setItem(CUSTOM_TASKS_STORAGE_KEY, JSON.stringify(customTasks));
}

function loadCustomTasks() {
    const saved = localStorage.getItem(CUSTOM_TASKS_STORAGE_KEY);
    if (!saved) {
        customTasks = [];
        return;
    }

    try {
        const parsed = JSON.parse(saved);
        customTasks = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        customTasks = [];
    }
}

function getNextTaskId() {
    const ids = getAllTasks().map(t => t.id).filter(n => typeof n === 'number');
    const maxId = ids.length ? Math.max(...ids) : 0;
    return maxId + 1;
}

function openAddTaskModal() {
    console.log('🔓 openAddTaskModal called!');
    const modal = document.getElementById('addTaskModal');
    const content = document.getElementById('addTaskModalContent');
    console.log('🔍 Modal elements found:', { modal: !!modal, content: !!content });
    if (!modal || !content) return;

    const titleEl = document.getElementById('addTaskModalTitle');
    const submitEl = document.getElementById('addTaskModalSubmit');
    if (editingTaskId == null) {
        if (titleEl) titleEl.textContent = 'Thêm nhiệm vụ mới';
        if (submitEl) submitEl.textContent = 'Lưu nhiệm vụ';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(() => {
        content.classList.remove('scale-0');
        content.classList.add('scale-100');
        const title = document.getElementById('newTaskTitle');
        if (title) title.focus();
    }, 50);
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    const content = document.getElementById('addTaskModalContent');
    if (!modal || !content) return;

    editingTaskId = null;

    content.classList.remove('scale-100');
    content.classList.add('scale-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 200);
}

function submitNewTask(event) {
    event.preventDefault();

    const titleEl = document.getElementById('newTaskTitle');
    const descEl = document.getElementById('newTaskDescription');
    const iconEl = document.getElementById('newTaskIcon');
    const starsEl = document.getElementById('newTaskStars');
    const colorEl = document.getElementById('newTaskColor');

    const title = (titleEl?.value || '').trim();
    const description = (descEl?.value || '').trim();
    const icon = ((iconEl?.value || '').trim() || '📝').slice(0, 4);
    const stars = Math.max(1, Math.min(3, parseInt(starsEl?.value || '1', 10) || 1));
    const color = (colorEl?.value || 'from-green-400 to-emerald-500').trim();

    if (!title || !description) return;

    if (editingTaskId != null) {
        const idx = customTasks.findIndex(t => t.id === editingTaskId);
        if (idx >= 0) {
            const previous = { ...customTasks[idx] };
            customTasks[idx] = {
                ...customTasks[idx],
                icon,
                title,
                description,
                stars,
                color
            };
            saveCustomTasks();
            normalizeTasksAfterCustomTaskChange(previous);
        }
    } else {
        const newTask = {
            id: getNextTaskId(),
            icon,
            title,
            description,
            stars,
            color
        };

        customTasks.push(newTask);
        saveCustomTasks();

        lastAddedTaskId = newTask.id;
    }

    if (titleEl) titleEl.value = '';
    if (descEl) descEl.value = '';
    if (iconEl) iconEl.value = '';
    if (starsEl) starsEl.value = '1';

    closeAddTaskModal();
    updateUI();
}

function editCustomTask(taskId) {
    const task = customTasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;

    const titleEl = document.getElementById('addTaskModalTitle');
    const submitEl = document.getElementById('addTaskModalSubmit');
    if (titleEl) titleEl.textContent = 'Sửa nhiệm vụ';
    if (submitEl) submitEl.textContent = 'Lưu thay đổi';

    const titleInput = document.getElementById('newTaskTitle');
    const descInput = document.getElementById('newTaskDescription');
    const iconInput = document.getElementById('newTaskIcon');
    const starsSelect = document.getElementById('newTaskStars');
    const colorSelect = document.getElementById('newTaskColor');

    if (titleInput) titleInput.value = task.title || '';
    if (descInput) descInput.value = task.description || '';
    if (iconInput) iconInput.value = task.icon || '';
    if (starsSelect) starsSelect.value = String(task.stars || 1);
    if (colorSelect) colorSelect.value = task.color || 'from-green-400 to-emerald-500';

    openAddTaskModal();
}

function deleteCustomTask(taskId) {
    const task = customTasks.find(t => t.id === taskId);
    if (!task) return;

    if (!confirm('Bạn có chắc muốn xóa nhiệm vụ này?')) return;

    customTasks = customTasks.filter(t => t.id !== taskId);
    saveCustomTasks();

    if (gameState.completedTasks.includes(taskId)) {
        gameState.completedTasks = gameState.completedTasks.filter(id => id !== taskId);
        gameState.totalStars = Math.max(0, (gameState.totalStars || 0) - (task.stars || 0));
        gameState.dailyTasksCompleted = Math.max(0, (gameState.dailyTasksCompleted || 0) - 1);
        updateHeroLevel();
        saveGameState();
    }

    updateUI();
    checkAchievements();
}

// Play Success Sound
function playSuccessSound() {
    console.log("playSuccessSound called");
    
    // Create visual feedback first
    createSuccessVisual();
    
    // Method 1: Try simple oscillator first
    try {
        console.log("Trying method 1: Web Audio API");
        const audioContext = new (window.AudioContext || window.webkitAudioContext());
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // Lower frequency
        oscillator.type = 'sine'; // Softer sound
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        
        console.log("Method 1 successful");
        
    } catch (error) {
        console.log("Method 1 failed:", error);
        
        // Method 2: Try Audio element
        try {
            console.log("Trying method 2: Audio element");
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.volume = 0.6;
            audio.play().then(() => {
                console.log("Method 2 successful");
            }).catch(err => {
                console.log("Method 2 play failed:", err);
            });
            
        } catch (error2) {
            console.log("Method 2 failed:", error2);
            
            // Method 3: Simple beep
            try {
                console.log("Trying method 3: Simple beep");
                const beep = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAAAQAEAAEAfAAAQAQABAAgAZGF0YQQAAAAAAA==');
                beep.volume = 0.8;
                beep.play().then(() => {
                    console.log("Method 3 successful");
                }).catch(err => {
                    console.log("Method 3 play failed:", err);
                });
                
            } catch (error3) {
                console.log("All sound methods failed:", error3);
            }
        }
    }
}

// Create visual feedback for success
function createSuccessVisual() {
    // Flash effect
    document.body.style.backgroundColor = '#10b981';
    setTimeout(() => {
        document.body.style.backgroundColor = '#f3f4f6';
        setTimeout(() => {
            document.body.style.backgroundColor = '';
        }, 100);
    }, 100);
    
    // Create floating stars
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.style.position = 'fixed';
            star.style.fontSize = '30px';
            star.style.left = Math.random() * window.innerWidth + 'px';
            star.style.top = Math.random() * window.innerHeight + 'px';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '9999';
            star.style.animation = 'floatUp 2s ease-out forwards';
            
            document.body.appendChild(star);
            
            setTimeout(() => star.remove(), 2000);
        }, i * 100);
    }
    
    // Add floating animation to CSS if not exists
    if (!document.querySelector('#floatAnimation')) {
        const style = document.createElement('style');
        style.id = 'floatAnimation';
        style.textContent = `
            @keyframes floatUp {
                0% { 
                    transform: translateY(0) scale(0); 
                    opacity: 1; 
                }
                50% { 
                    transform: translateY(-50px) scale(1.5); 
                    opacity: 1; 
                }
                100% { 
                    transform: translateY(-150px) scale(0.5); 
                    opacity: 0; 
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export functions to global scope
Object.assign(window, {
    resetDailyTasks,
    completeTask,
    closeModal,
    closeVictoryModal,
    openAddTaskModal,
    closeAddTaskModal,
    submitNewTask,
    editCustomTask,
    deleteCustomTask
});

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing game...');
    console.log('🔍 Checking if functions are exported:', {
        openAddTaskModal: typeof window.openAddTaskModal,
        resetDailyTasks: typeof window.resetDailyTasks,
        completeTask: typeof window.completeTask
    });
    
    // Add event listeners for buttons
    const addTaskBtn = document.getElementById('addTaskBtn');
    const resetTasksBtn = document.getElementById('resetTasksBtn');
    
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            console.log('🔓 Add task button clicked!');
            if (window.openAddTaskModal) {
                window.openAddTaskModal();
            } else {
                console.error('❌ openAddTaskModal not available!');
            }
        });
    }
    
    if (resetTasksBtn) {
        resetTasksBtn.addEventListener('click', function() {
            console.log('🔄 Reset tasks button clicked!');
            if (window.resetDailyTasks) {
                window.resetDailyTasks();
            } else {
                console.error('❌ resetDailyTasks not available!');
            }
        });
    }
    
    initGame();
});
