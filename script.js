// 채팅 애플리케이션 상태 관리
class ChatApp {
    constructor() {
        this.currentChannel = 'general';
        this.currentUser = '내 이름';
        this.users = [
            { name: '김철수', status: 'online', avatar: 'face1.png' },
            { name: '이영희', status: 'offline', avatar: 'face2.png' },
            { name: '박민수', status: 'online', avatar: 'face1.png' },
            { name: '최수진', status: 'online', avatar: 'face3.png' }
        ];
        
        this.messages = {
            general: [
                {
                    id: 1,
                    sender: '김철수',
                    text: '안녕하세요! 새로운 프로젝트 관련해서 회의 일정이 어떻게 되나요?',
                    time: new Date(Date.now() - 3600000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    avatar: 'face1.png'
                },
                {
                    id: 2,
                    sender: '박민수',
                    text: '이번 주 금요일 오후 2시에 회의실 A에서 진행 예정입니다.',
                    time: new Date(Date.now() - 3000000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    avatar: 'face1.png'
                },
                {
                    id: 3,
                    sender: '최수진',
                    text: '네, 확인했습니다! 준비할 자료가 있다면 미리 알려주세요.',
                    time: new Date(Date.now() - 1800000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                    avatar: 'face3.png'
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

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.altKey) {
                    // Alt + Enter로 줄바꿈 허용
                    return;
                } else {
                    e.preventDefault();
                    this.sendMessage();
                }
            }
        });

        messageInput.addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
            this.autoResizeTextarea(e.target);
            this.simulateTyping();
        });

        sendBtn.addEventListener('click', () => this.sendMessage());

        // 드래그 앤 드롭 이벤트
        this.setupDragAndDrop();

        // 복사-붙여넣기 이벤트
        messageInput.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });

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
            avatar: 'face2.png',
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
        messageDiv.style.position = 'relative';

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
        
        // 파일 메시지 처리
        if (message.isFile) {
            textDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-paperclip"></i>
                    <span>${message.text}</span>
                    <button onclick="downloadFile('${message.fileName}')" style="background: none; border: none; color: inherit; cursor: pointer;">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
        }
        // 이미지 메시지 처리
        else if (message.isImage) {
            textDiv.innerHTML = `
                <div>
                    <div>${message.text}</div>
                    <img src="${message.imageUrl}" style="max-width: 300px; max-height: 200px; border-radius: 8px; margin-top: 8px; cursor: pointer;" onclick="openImageModal('${message.imageUrl}')">
                </div>
            `;
        }
        // 일반 텍스트 메시지
        else {
            textDiv.textContent = message.text;
        }

        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(textDiv);

        // 메시지 액션 버튼들 (호버 시 표시)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.innerHTML = `
            <button class="action-icon" onclick="chatApp.replyToMessage('${message.id}')" title="답변">
                <i class="fas fa-reply"></i>
            </button>
            <button class="action-icon" onclick="chatApp.addReaction('${message.id}', '👍')" title="좋아요">
                <i class="fas fa-thumbs-up"></i>
            </button>
            <button class="action-icon" onclick="chatApp.addReaction('${message.id}', '❤️')" title="하트">
                <i class="fas fa-heart"></i>
            </button>
        `;

        // 이모지 반응 표시 (샘플)
        if (Math.random() < 0.3) { // 30% 확률로 반응 표시
            const reactionsDiv = document.createElement('div');
            reactionsDiv.className = 'message-reactions';
            const reactions = ['👍 2', '❤️ 1', '😊 1'];
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            reactionsDiv.innerHTML = `<span class="reaction">${randomReaction}</span>`;
            contentDiv.appendChild(reactionsDiv);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(actionsDiv);

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

    // 텍스트 영역 자동 리사이즈
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // 드래그 앤 드롭 설정
    setupDragAndDrop() {
        const chatMessages = document.getElementById('chat-messages');
        const dragOverlay = document.getElementById('drag-drop-overlay');
        let dragCounter = 0;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            chatMessages.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        chatMessages.addEventListener('dragenter', (e) => {
            dragCounter++;
            dragOverlay.style.display = 'flex';
        });

        chatMessages.addEventListener('dragleave', (e) => {
            dragCounter--;
            if (dragCounter === 0) {
                dragOverlay.style.display = 'none';
            }
        });

        chatMessages.addEventListener('drop', (e) => {
            dragCounter = 0;
            dragOverlay.style.display = 'none';
            
            const files = [...e.dataTransfer.files];
            if (files.length > 0) {
                this.handleFileUpload(files);
            }
        });
    }

    // 파일 업로드 처리
    handleFileUpload(files) {
        files.forEach(file => {
            const fileMessage = {
                id: Date.now() + Math.random(),
                sender: this.currentUser,
                text: `📎 ${file.name} (${this.formatFileSize(file.size)})`,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                avatar: 'face2.png',
                isOwn: true,
                isFile: true,
                fileType: file.type,
                fileName: file.name
            };

            if (this.currentChannel === 'general') {
                this.messages.general.push(fileMessage);
            } else {
                if (!this.privateMessages[this.currentChannel]) {
                    this.privateMessages[this.currentChannel] = [];
                }
                this.privateMessages[this.currentChannel].push(fileMessage);
            }

            this.displayMessages();
            this.scrollToBottom();
            
            // 파일 보관함에 추가
            this.addToFileStorage(file);
        });
    }

    // 복사-붙여넣기 처리
    handlePaste(e) {
        const items = [...e.clipboardData.items];
        
        items.forEach(item => {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    const imageMessage = {
                        id: Date.now() + Math.random(),
                        sender: this.currentUser,
                        text: `🖼️ 이미지가 붙여넣어졌습니다`,
                        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                        avatar: 'face2.png',
                        isOwn: true,
                        isImage: true,
                        imageUrl: URL.createObjectURL(blob)
                    };

                    if (this.currentChannel === 'general') {
                        this.messages.general.push(imageMessage);
                    } else {
                        if (!this.privateMessages[this.currentChannel]) {
                            this.privateMessages[this.currentChannel] = [];
                        }
                        this.privateMessages[this.currentChannel].push(imageMessage);
                    }

                    this.displayMessages();
                    this.scrollToBottom();
                }
            }
        });
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 파일 보관함에 추가
    addToFileStorage(file) {
        const fileList = document.querySelector('.file-list');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        let iconClass = 'fas fa-file';
        if (file.type.includes('excel') || file.name.endsWith('.xlsx')) {
            iconClass = 'fas fa-file-excel';
        } else if (file.type.includes('pdf')) {
            iconClass = 'fas fa-file-pdf';
        } else if (file.type.includes('word')) {
            iconClass = 'fas fa-file-word';
        } else if (file.type.includes('image')) {
            iconClass = 'fas fa-file-image';
        }

        fileItem.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${file.name}</span>
            <button class="download-btn" title="다운로드">
                <i class="fas fa-download"></i>
            </button>
        `;

        fileList.appendChild(fileItem);
    }

    // 답변 기능
    replyToMessage(messageId) {
        const replyIndicator = document.createElement('div');
        replyIndicator.className = 'reply-indicator';
        replyIndicator.textContent = '💬 메시지에 답변 중...';
        
        const inputContainer = document.querySelector('.message-input-container');
        inputContainer.insertBefore(replyIndicator, inputContainer.firstChild);
        
        document.getElementById('message-input').focus();
        
        // 답변 취소 버튼 추가
        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '✕';
        cancelBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: #4a90e2;
        `;
        cancelBtn.onclick = () => replyIndicator.remove();
        replyIndicator.style.position = 'relative';
        replyIndicator.appendChild(cancelBtn);
    }

    // 이모지 반응 추가
    addReaction(messageId, emoji) {
        // 실제 구현에서는 서버에 저장
        console.log(`메시지 ${messageId}에 ${emoji} 반응 추가`);
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
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = (e) => {
        const files = [...e.target.files];
        if (files.length > 0) {
            chatApp.handleFileUpload(files);
        }
    };
    input.click();
}

// 파일 다운로드
function downloadFile(fileName) {
    alert(`${fileName} 다운로드 시작 (실제 구현 시 서버에서 파일 제공)`);
}

// 이미지 모달 열기
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.onclick = () => {
        document.body.removeChild(modal);
    };
}

// 전역 변수
let chatApp;

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    chatApp = new ChatApp();

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