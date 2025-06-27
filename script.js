// 채팅 애플리케이션 상태 관리
class ChatApp {
    constructor() {
        this.currentChannel = 'general';
        this.currentUser = '내 이름';
        this.users = [
            { name: '김철수', status: 'online', avatar: 'https://via.placeholder.com/36/FF6B6B/FFFFFF?text=김' },
            { name: '이영희', status: 'offline', avatar: 'https://via.placeholder.com/36/4ECDC4/FFFFFF?text=이' },
            { name: '박민수', status: 'online', avatar: 'https://via.placeholder.com/36/FFE66D/000000?text=박' },
            { name: '최수진', status: 'online', avatar: 'https://via.placeholder.com/36/A8E6CF/000000?text=최' }
        ];
        
        this.messages = {
            general: [
                {
                    id: 1,
                    sender: '김철수',
                    text: '안녕하세요! 새로운 프로젝트 관련해서 회의 일정이 어떻게 되나요?',
                    time: new Date(Date.now() - 3600000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    avatar: 'https://via.placeholder.com/36/FF6B6B/FFFFFF?text=김'
                },
                {
                    id: 2,
                    sender: '박민수',
                    text: '이번 주 금요일 오후 2시에 회의실 A에서 진행 예정입니다.',
                    time: new Date(Date.now() - 3000000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    avatar: 'https://via.placeholder.com/36/FFE66D/000000?text=박'
                },
                {
                    id: 3,
                    sender: '최수진',
                    text: '네, 확인했습니다! 준비할 자료가 있다면 미리 알려주세요.',
                    time: new Date(Date.now() - 1800000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    avatar: 'https://via.placeholder.com/36/A8E6CF/000000?text=최'
                }
            ]
        };

        this.privateMessages = {};
        this.typingUsers = new Set();
        this.unreadCounts = {
            general: 3,
            '김철수': 2,
            '이영희': 0,
            '박민수': 0
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.displayMessages();
        this.startTypingSimulation();
        this.updateUnreadCounts();
    }

    bindEvents() {
        // 메시지 전송
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        messageInput.addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
            this.simulateTyping();
        });

        sendBtn.addEventListener('click', () => this.sendMessage());

        // 채널 및 DM 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.closest('.channel-item')) {
                const channel = e.target.closest('.channel-item').dataset.channel;
                this.switchChannel(channel);
            }

            if (e.target.closest('.dm-item')) {
                const user = e.target.closest('.dm-item').dataset.user;
                this.switchToPrivateChat(user);
            }

            if (e.target.closest('.user-item')) {
                const userName = e.target.closest('.user-item').querySelector('span').textContent;
                if (userName !== this.currentUser) {
                    this.switchToPrivateChat(userName);
                }
            }
        });

        // 모달 관련 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const text = messageInput.value.trim();

        if (!text) return;

        const message = {
            id: Date.now(),
            sender: this.currentUser,
            text: text,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            avatar: 'https://via.placeholder.com/36/4A90E2/FFFFFF?text=ME',
            isOwn: true
        };

        if (this.currentChannel === 'general') {
            if (!this.messages.general) this.messages.general = [];
            this.messages.general.push(message);
        } else {
            // 프라이빗 메시지
            if (!this.privateMessages[this.currentChannel]) {
                this.privateMessages[this.currentChannel] = [];
            }
            this.privateMessages[this.currentChannel].push(message);
        }

        messageInput.value = '';
        this.updateCharCount(0);
        this.displayMessages();
        this.scrollToBottom();

        // 자동 응답 시뮬레이션
        setTimeout(() => {
            this.simulateResponse();
        }, 1000 + Math.random() * 2000);
    }

    simulateResponse() {
        const responses = [
            '좋은 아이디어네요!',
            '동의합니다.',
            '확인했습니다.',
            '더 자세히 논의해봐야겠어요.',
            '언제 시간 되실까요?',
            '네, 알겠습니다!',
            '좋은 제안이네요. 👍',
            '다음 주에 다시 얘기해볼까요?'
        ];

        let sender, avatar;
        if (this.currentChannel === 'general') {
            const availableUsers = this.users.filter(u => u.status === 'online' && u.name !== this.currentUser);
            const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
            sender = randomUser.name;
            avatar = randomUser.avatar;
        } else {
            sender = this.currentChannel;
            const user = this.users.find(u => u.name === sender);
            avatar = user ? user.avatar : 'https://via.placeholder.com/36/888888/FFFFFF?text=?';
        }

        const response = {
            id: Date.now(),
            sender: sender,
            text: responses[Math.floor(Math.random() * responses.length)],
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            avatar: avatar,
            isOwn: false
        };

        if (this.currentChannel === 'general') {
            this.messages.general.push(response);
        } else {
            if (!this.privateMessages[this.currentChannel]) {
                this.privateMessages[this.currentChannel] = [];
            }
            this.privateMessages[this.currentChannel].push(response);
        }

        this.displayMessages();
        this.scrollToBottom();
    }

    switchChannel(channel) {
        this.currentChannel = channel;
        this.updateChannelUI('general');
        this.displayMessages();
        this.clearUnreadCount(channel);
    }

    switchToPrivateChat(userName) {
        this.currentChannel = userName;
        this.updateChannelUI(userName);
        this.displayMessages();
        this.clearUnreadCount(userName);
        
        // 프라이빗 메시지 초기화
        if (!this.privateMessages[userName]) {
            this.privateMessages[userName] = [
                {
                    id: Date.now(),
                    sender: userName,
                    text: `안녕하세요! ${userName}와의 개인 대화입니다.`,
                    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    avatar: this.users.find(u => u.name === userName)?.avatar || 'https://via.placeholder.com/36/888888/FFFFFF?text=?',
                    isOwn: false
                }
            ];
        }
    }

    updateChannelUI(channel) {
        // 활성 채널 표시 업데이트
        document.querySelectorAll('.channel-item, .dm-item').forEach(item => {
            item.classList.remove('active');
        });

        if (channel === 'general') {
            document.querySelector('.channel-item[data-channel="general"]').classList.add('active');
            document.getElementById('current-channel-name').textContent = '# 전체 채팅';
            document.getElementById('channel-description').textContent = '모든 팀원들과 소통하는 공간입니다';
        } else {
            document.querySelector(`.dm-item[data-user="${channel}"]`)?.classList.add('active');
            document.getElementById('current-channel-name').textContent = `@ ${channel}`;
            document.getElementById('channel-description').textContent = '개인 메시지';
        }
    }

    displayMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        let messages;

        if (this.currentChannel === 'general') {
            messages = this.messages.general || [];
        } else {
            messages = this.privateMessages[this.currentChannel] || [];
        }

        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        this.scrollToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.isOwn ? 'own' : ''} ${this.currentChannel !== 'general' ? 'private' : ''}`;

        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = message.avatar;
        avatar.alt = message.sender;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';

        const senderSpan = document.createElement('span');
        senderSpan.className = 'sender-name';
        senderSpan.textContent = message.sender;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = message.time;

        headerDiv.appendChild(senderSpan);
        headerDiv.appendChild(timeSpan);

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = message.text;

        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(textDiv);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        return messageDiv;
    }

    updateCharCount(count) {
        const charCountElement = document.getElementById('char-count');
        charCountElement.textContent = `${count}/1000`;
        
        if (count > 800) {
            charCountElement.style.color = '#e01e5a';
        } else if (count > 500) {
            charCountElement.style.color = '#ffb000';
        } else {
            charCountElement.style.color = '#868686';
        }
    }

    simulateTyping() {
        const typingIndicator = document.getElementById('typing-indicator');
        
        // 타이핑 시뮬레이션
        setTimeout(() => {
            if (this.currentChannel === 'general') {
                const typingUser = this.users[Math.floor(Math.random() * this.users.length)];
                typingIndicator.textContent = `${typingUser.name}님이 입력 중...`;
                
                setTimeout(() => {
                    typingIndicator.textContent = '';
                }, 2000);
            }
        }, 500);
    }

    startTypingSimulation() {
        // 주기적으로 타이핑 시뮬레이션
        setInterval(() => {
            if (Math.random() < 0.3 && this.currentChannel === 'general') {
                const typingUser = this.users[Math.floor(Math.random() * this.users.length)];
                const typingIndicator = document.getElementById('typing-indicator');
                typingIndicator.textContent = `${typingUser.name}님이 입력 중...`;
                
                setTimeout(() => {
                    typingIndicator.textContent = '';
                }, 1000 + Math.random() * 2000);
            }
        }, 10000);
    }

    updateUnreadCounts() {
        Object.keys(this.unreadCounts).forEach(key => {
            const count = this.unreadCounts[key];
            let element;
            
            if (key === 'general') {
                element = document.querySelector('.channel-item .unread-count');
            } else {
                element = document.querySelector(`.dm-item[data-user="${key}"] .unread-count`);
            }
            
            if (element) {
                if (count > 0) {
                    element.textContent = count;
                    element.style.display = 'inline-block';
                } else {
                    element.style.display = 'none';
                }
            }
        });
    }

    clearUnreadCount(channel) {
        this.unreadCounts[channel] = 0;
        this.updateUnreadCounts();
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    openModal() {
        document.getElementById('modal-overlay').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
}

// 전역 함수들
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// 이모지 선택기 (간단한 구현)
function showEmojiPicker() {
    const emojis = ['😀', '😊', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💡'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const messageInput = document.getElementById('message-input');
    messageInput.value += emoji;
    messageInput.focus();
}

// 파일 첨부 시뮬레이션
function attachFile() {
    alert('파일 첨부 기능은 서버 구현 후 사용 가능합니다.');
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    const chatApp = new ChatApp();

    // 이모지 버튼 이벤트
    document.querySelector('.emoji-btn').addEventListener('click', showEmojiPicker);
    
    // 파일 첨부 버튼 이벤트
    document.querySelector('.attach-btn').addEventListener('click', attachFile);
    
    // 반응형 사이드바 토글 (모바일용)
    if (window.innerWidth <= 768) {
        const sidebarToggle = document.createElement('button');
        sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
        sidebarToggle.className = 'sidebar-toggle';
        sidebarToggle.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: #4a90e2;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
        `;
        document.body.appendChild(sidebarToggle);
        
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }

    // 온라인 사용자 상태 업데이트 시뮬레이션
    setInterval(() => {
        const onlineCount = chatApp.users.filter(u => u.status === 'online').length + 1; // +1 for current user
        const onlineHeader = document.querySelector('.online-users .section-header h3');
        onlineHeader.innerHTML = `<i class="fas fa-circle"></i> 온라인 (${onlineCount})`;
    }, 30000);

    // 새 메시지 알림 시뮬레이션
    setInterval(() => {
        if (Math.random() < 0.2) {
            const channels = ['general', '김철수', '박민수'];
            const randomChannel = channels[Math.floor(Math.random() * channels.length)];
            
            if (randomChannel !== chatApp.currentChannel) {
                chatApp.unreadCounts[randomChannel] = (chatApp.unreadCounts[randomChannel] || 0) + 1;
                chatApp.updateUnreadCounts();
            }
        }
    }, 15000);
}); 