const firebaseConfig = {
    apiKey: "AIzaSyA4rgEg91vfNwOtR1deDYv2AZwoK6orIJQ",
    authDomain: "pyramid-8d06e.firebaseapp.com",
    projectId: "pyramid-8d06e",
    storageBucket: "pyramid-8d06e.firebasestorage.app",
    messagingSenderId: "1003119978209",
    appId: "1:1003119978209:web:c2fea2c4311adb6cd439a0",
    measurementId: "G-C3GZB9SV9F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let students = [];
// In-memory student records are now handled by name
let hasAgreed = false;

async function init() {
    // Listen for real-time updates
    database.ref('students').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            students = Object.values(data);
        } else {
            students = [];
        }
        render();
    });

    await switchView('password'); // Start with password screen
    setupEventListeners();
    setupPasswordLogic();
}

function setupEventListeners() {
    // View Switcher
    document.getElementById('show-ranking').onclick = async () => await switchView('ranking');
    document.getElementById('show-voting').onclick = async () => await switchView('voting');

    // Entry Screen Logic
    const agreement = document.getElementById('rules-agreement');
    const startBtn = document.getElementById('start-voting-btn');

    agreement.onchange = (e) => {
        if (e.target.checked) {
            startBtn.disabled = false;
            startBtn.classList.add('active');
        } else {
            startBtn.disabled = true;
            startBtn.classList.remove('active');
        }
    };

    startBtn.onclick = async () => {
        hasAgreed = true;
        await switchView('voting');
    };

    // Voting Logic
    const slots = document.querySelectorAll('.slot-refined input');
    slots.forEach(input => {
        input.addEventListener('input', updateSubmitButtonState);
    });

    document.getElementById('submit-votes').onclick = castVotes;
}

function setupPasswordLogic() {
    const slots = document.querySelectorAll('.p-slot');
    const password = "HONEY";

    slots.forEach((slot, index) => {
        slot.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase();
            e.target.value = value;

            if (value && index < slots.length - 1) {
                slots[index + 1].focus();
            }

            checkPassword();
        });

        slot.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !slot.value && index > 0) {
                slots[index - 1].focus();
            }
        });
    });

    async function checkPassword() {
        const entered = Array.from(slots).map(s => s.value).join('').toUpperCase();
        if (entered.length === 5) {
            if (entered === password) {
                // Success animation
                slots.forEach(s => s.style.borderBottomColor = '#4CAF50');
                await new Promise(r => setTimeout(r, 500));
                switchView('entry');
            } else {
                // Error animation
                slots.forEach(s => s.classList.add('error'));
                setTimeout(() => {
                    slots.forEach(s => {
                        s.classList.remove('error');
                        s.value = '';
                    });
                    slots[0].focus();
                }, 500);
            }
        }
    }
}

function updateSubmitButtonState() {
    const slots = document.querySelectorAll('.slot-refined input');
    const inputs = Array.from(slots);
    const names = inputs.map(input => input.value.trim());

    // Reset styles
    inputs.forEach(input => input.classList.remove('invalid'));

    let hasSubstringConflict = false;
    let conflictIndices = new Set();

    // Check for unique names and substring overlaps
    for (let i = 0; i < names.length; i++) {
        if (!names[i]) continue;
        for (let j = 0; j < names.length; j++) {
            if (i === j || !names[j]) continue;

            // Block if name[i] is a substring of name[j]
            // Case insensitive comparison for better security
            if (names[j].toLowerCase().includes(names[i].toLowerCase())) {
                hasSubstringConflict = true;
                conflictIndices.add(i);
                conflictIndices.add(j);
            }
        }
    }

    // Apply error style to conflicting slots
    conflictIndices.forEach(index => {
        inputs[index].classList.add('invalid');
    });

    const allFilled = names.every(name => name !== '');
    const uniqueNames = new Set(names.filter(n => n !== '')).size === names.filter(n => n !== '').length;
    const btn = document.getElementById('submit-votes');

    // Button is active only if all slots are filled, no substrings, and all names unique
    if (allFilled && !hasSubstringConflict && uniqueNames) {
        btn.disabled = false;
        btn.classList.add('active');
    } else {
        btn.disabled = true;
        btn.classList.remove('active');
    }
}

async function switchView(view) {
    const rankingBtn = document.getElementById('show-ranking');
    const votingBtn = document.getElementById('show-voting');
    const entryView = document.getElementById('entry-view');
    const rankingView = document.getElementById('ranking-view');
    const votingView = document.getElementById('voting-view');
    const passwordView = document.getElementById('password-view');
    const nav = document.querySelector('.view-switcher');

    // Prevent bypassing entry screen
    if (!hasAgreed && view !== 'entry' && view !== 'password') {
        alert('게임 규칙에 동의해야 합니다.');
        return;
    }

    const views = [entryView, rankingView, votingView, passwordView];
    const otherViews = views.filter(v => v.id !== `${view}-view`);
    const currentView = views.find(v => !v.classList.contains('hidden') && v.id !== `${view}-view`);

    if (currentView) {
        currentView.style.opacity = '0';
        currentView.style.transform = 'translateY(-10px)';
        currentView.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        await new Promise(resolve => setTimeout(resolve, 300));
        // Hide all other views just in case
        views.forEach(v => v.classList.add('hidden'));
        // Reset styles
        currentView.style.opacity = '';
        currentView.style.transform = '';
        currentView.style.transition = '';
    } else {
        // If no view is currently visible, still ensure others are hidden
        views.forEach(v => v.classList.add('hidden'));
    }

    if (view === 'password') {
        passwordView.classList.remove('hidden');
        nav.style.display = 'none';
        hasAgreed = false;
    } else if (view === 'entry') {
        entryView.classList.remove('hidden');
        nav.style.display = 'none';
        hasAgreed = false;
    } else if (view === 'ranking') {
        rankingBtn.classList.add('active');
        votingBtn.classList.remove('active');
        rankingView.classList.remove('hidden');
        nav.style.display = 'flex';
        render();
    } else {
        rankingBtn.classList.remove('active');
        votingBtn.classList.add('active');
        votingView.classList.remove('hidden');
        nav.style.display = 'flex';
        const slots = document.querySelectorAll('.slot-refined input');
        slots.forEach(input => input.value = '');
        updateSubmitButtonState();
    }
}

function render() {
    renderPyramid();
}

function renderPyramid() {
    const container = document.getElementById('pyramid-container');
    container.innerHTML = '';

    const ranks = ['A', 'B', 'C', 'D', 'F'];

    ranks.forEach(rank => {
        const rankStudents = students.filter(s => s.rank === rank);

        const groupDiv = document.createElement('div');
        groupDiv.className = 'rank-group';

        const rankHeader = document.createElement('div');
        rankHeader.className = 'rank-header';
        rankHeader.textContent = rank;

        const studentsListDiv = document.createElement('div');
        studentsListDiv.className = 'rank-students-list';

        rankStudents.forEach(student => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'student-row';

            rowDiv.innerHTML = `
                <div class="student-name">${student.name}</div>
                <div class="student-bar-placeholder"></div>
                <div class="student-votes-count">${student.votes}표</div>
            `;
            studentsListDiv.appendChild(rowDiv);
        });

        // Add placeholder if no students in this rank
        if (rankStudents.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'student-row';
            emptyMsg.style.justifyContent = 'center';
            emptyMsg.innerHTML = '<div style="color: #2a3a4d; font-size: 0.8rem;">검색 결과 없음</div>';
            studentsListDiv.appendChild(emptyMsg);
        }

        groupDiv.appendChild(rankHeader);
        groupDiv.appendChild(studentsListDiv);
        container.appendChild(groupDiv);
    });
}

async function castVotes() {
    const slots = document.querySelectorAll('.slot-refined input');
    const votedNames = Array.from(slots).map(input => input.value.trim()).filter(name => name !== '');

    if (votedNames.length === 5) {
        votedNames.forEach(name => {
            // Find existing student or create key
            const studentKey = name.replace(/[.#$[\]]/g, "_"); // Firebase keys can't have certain chars
            const studentRef = database.ref('students/' + studentKey);

            studentRef.transaction((currentData) => {
                if (currentData) {
                    currentData.votes++;
                    return currentData;
                } else {
                    return {
                        id: Date.now() + Math.random(),
                        name: name,
                        votes: 1,
                        rank: 'F',
                        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
                    };
                }
            }, (error, committed, snapshot) => {
                if (error) {
                    console.error('Transaction failed:', error);
                } else if (committed) {
                    // After all transactions, recalculate ranks on server-side or client-side sync
                    // Since we have a real-time listener, the UI will update
                    // We'll trigger a rank calculation on the local data as well
                    setTimeout(calculateRanksAndSync, 500);
                }
            });
        });

        // Clear inputs
        slots.forEach(input => input.value = '');
        updateSubmitButtonState();

        alert('투표가 성공적으로 완료되었습니다.');
        await switchView('ranking');
    }
}

function calculateRanksAndSync() {
    // Sort students by votes
    const sorted = [...students].sort((a, b) => b.votes - a.votes);

    sorted.forEach((s, index) => {
        let newRank = 'F';
        if (s.votes === 0) newRank = 'F';
        else if (index < 2) newRank = 'A';
        else if (index < 4) newRank = 'B';
        else if (index < 6) newRank = 'C';
        else if (index < 9) newRank = 'D';

        const studentKey = s.name.replace(/[.#$[\]]/g, "_");
        database.ref('students/' + studentKey).update({ rank: newRank });
    });
}

function calculateRanks() {
    const sorted = [...students].sort((a, b) => b.votes - a.votes);

    sorted.forEach((s, index) => {
        let newRank = 'F';
        if (s.votes === 0) newRank = 'F';
        else if (index < 2) newRank = 'A';
        else if (index < 4) newRank = 'B';
        else if (index < 6) newRank = 'C';
        else if (index < 9) newRank = 'D';

        const original = students.find(orig => orig.id === s.id);
        original.rank = newRank;
    });
}

init();
