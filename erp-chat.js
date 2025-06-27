class ERPChatApp {
    constructor() {
        this.currentRoom = null;
        this.isTyping = false;
        this.typingTimer = null;
        this.chatPanel = document.getElementById("chatPanel");
        this.chatOverlay = document.getElementById("chatOverlay");
        
        // 사용자 데이터
        this.users = {
            "김철수": { avatar: "face1.png", status: "온라인" },
            "이영희": { avatar: "face2.png", status: "온라인" },
            "최수진": { avatar: "face3.png", status: "자리비움" },
            "김민준": { avatar: "face2.png", status: "온라인" } // 본인
        };

        // 즐겨찾기 및 나간 채팅방 관리
        this.favoriteRooms = new Set();
        this.leftRooms = new Set();

        // 채팅방 데이터
        this.chatRooms = {
            "general": {
                name: "# 전체 채팅",
                type: "channel",
                members: ["김철수", "이영희", "최수진", "김민준"],
                messages: [
                    {
                        id: 1,
                        sender: "김철수",
                        content: "안녕하세요! 오늘 회의 일정이 어떻게 되나요?",
                        time: new Date(Date.now() - 60000),
                        reactions: [{ emoji: "👍", users: ["이영희"], count: 1 }]
                    },
                    {
                        id: 2,
                        sender: "이영희", 
                        content: "오후 2시에 진행 예정입니다. 준비 자료는 모두 공유드렸어요.",
                        time: new Date(Date.now() - 30000),
                        reactions: []
                    },
                    {
                        id: 3,
                        sender: "최수진",
                        content: "감사합니다! 확인했습니다.",
                        time: new Date(Date.now() - 10000),
                        reactions: [{ emoji: "❤️", users: ["김철수"], count: 1 }]
                    }
                ],
                unreadCount: 3,
                lastMessage: "감사합니다! 확인했습니다."
            },
            "김철수": {
                name: "김철수",
                type: "dm",
                messages: [
                    {
                        id: 1,
                        sender: "김철수",
                        content: "안녕하세요! 프로젝트 관련해서 질문이 있습니다.",
                        time: new Date(Date.now() - 300000),
                        reactions: []
                    }
                ],
                unreadCount: 1,
                lastMessage: "안녕하세요! 프로젝트 관련해서 질문이 있습니다."
            },
            "이영희": {
                name: "이영희",
                type: "dm",
                messages: [
                    {
                        id: 1,
                        sender: "이영희",
                        content: "파일 공유 감사합니다. 잘 받았어요!",
                        time: new Date(Date.now() - 1800000),
                        reactions: []
                    }
                ],
                unreadCount: 0,
                lastMessage: "파일 공유 감사합니다. 잘 받았어요!"
            },
            "최수진": {
                name: "최수진",
                type: "dm",
                messages: [
                    {
                        id: 1,
                        sender: "최수진",
                        content: "내일 회의 준비 완료했습니다.",
                        time: new Date(Date.now() - 3600000),
                        reactions: []
                    }
                ],
                unreadCount: 0,
                lastMessage: "내일 회의 준비 완료했습니다."
            }
        };

        this.initializeApp();
    }

    initializeApp() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateChatList();
        this.autoRespond();
    }

    setupEventListeners() {
        // 메시지 입력 이벤트
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => this.autoResizeTextarea());
            messageInput.addEventListener('keydown', (e) => this.handleKeyPress(e));
            messageInput.addEventListener('input', () => this.handleTyping());
        }

        // 채팅 검색
        const searchInput = document.querySelector('.chat-search input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchChats(e.target.value));
        }

        // 모바일 반응형
        window.addEventListener('resize', () => this.handleResize());
    }

    // 채팅 패널 토글
    toggleChat() {
        const isOpen = this.chatPanel.classList.contains('open');
        
        if (isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.chatPanel.classList.add('open');
        
        // 모바일에서 오버레이 표시
        if (window.innerWidth <= 768) {
            this.chatOverlay.classList.add('show');
        }
        
        // body 스크롤 방지 (모바일)
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
    }

    closeChat() {
        this.chatPanel.classList.remove('open');
        this.chatOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // 채팅 목록으로 돌아가기
        this.backToChatList();
    }

    // 채팅방 열기
    openChatRoom(roomId) {
        this.currentRoom = roomId;
        const room = this.chatRooms[roomId];
        
        if (!room) return;

        // 읽지 않은 메시지 수 초기화
        room.unreadCount = 0;
        this.updateChatList();

        // UI 업데이트
        document.getElementById('currentChatName').textContent = room.name;
        
        // 상태 표시 업데이트
        const statusText = room.type === 'channel' 
            ? `${room.members.length}명 온라인`
            : this.users[roomId]?.status || '오프라인';
        document.querySelector('.chat-status').textContent = statusText;

        // 메시지 표시
        this.renderMessages(room.messages);

        // 뷰 전환
        document.querySelector('.chat-list').style.display = 'none';
        document.getElementById('chatMessages').style.display = 'flex';

        // 메시지 영역 스크롤을 맨 아래로
        setTimeout(() => {
            const messagesArea = document.getElementById('messagesArea');
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 100);
    }

    // 채팅 목록으로 돌아가기
    backToChatList() {
        this.currentRoom = null;
        document.querySelector('.chat-list').style.display = 'flex';
        document.getElementById('chatMessages').style.display = 'none';
    }

    // 메시지 렌더링
    renderMessages(messages) {
        const messagesArea = document.getElementById('messagesArea');
        messagesArea.innerHTML = '';

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesArea.appendChild(messageElement);
        });
    }

    // 메시지 요소 생성
    createMessageElement(message) {
        const isOwn = message.sender === '김민준';
        const user = this.users[message.sender];
        const now = new Date();
        const timeDiff = (now - message.time) / 1000 / 60; // 분 단위
        const canEdit = isOwn && timeDiff <= 5 && !message.deleted; // 5분 이내, 본인 메시지, 삭제되지 않음
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : ''} ${message.deleted ? 'deleted' : ''}`;
        messageDiv.dataset.messageId = message.id;

        const timeText = this.formatTime(message.time);
        const timeLimit = canEdit ? `<span class="time-limit-indicator">${Math.ceil(5 - timeDiff)}분 남음</span>` : '';

        messageDiv.innerHTML = `
            <img src="${user.avatar}" alt="${message.sender}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">${message.sender}</span>
                    <span class="message-time">${timeText}${timeLimit}</span>
                </div>
                <div class="message-bubble" id="bubble-${message.id}">
                    ${message.deleted ? 
                        '<i class="fas fa-ban"></i> 삭제된 메시지입니다' : 
                        this.formatMessageContent(message.content)
                    }
                </div>
                ${message.edited && !message.deleted ? '<div class="message-edited">수정됨</div>' : ''}
                ${message.reactions && message.reactions.length > 0 ? this.renderReactions(message.reactions) : ''}
            </div>
            <div class="message-actions">
                <button class="action-btn" onclick="chatApp.addReaction(${message.id}, '👍')" title="좋아요">
                    <i class="far fa-thumbs-up"></i>
                </button>
                <button class="action-btn" onclick="chatApp.addReaction(${message.id}, '❤️')" title="하트">
                    <i class="far fa-heart"></i>
                </button>
                <button class="action-btn" onclick="chatApp.replyToMessage(${message.id})" title="답장">
                    <i class="fas fa-reply"></i>
                </button>
                ${canEdit ? `
                    <button class="action-btn edit" onclick="chatApp.editMessage(${message.id})" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="chatApp.deleteMessage(${message.id})" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
                <button class="action-btn" onclick="chatApp.shareMessage(${message.id})" title="공유">
                    <i class="fas fa-share"></i>
                </button>
            </div>
        `;

        return messageDiv;
    }

    // 이모지 반응 렌더링
    renderReactions(reactions) {
        if (!reactions.length) return '';
        
        return `
            <div class="message-reactions">
                ${reactions.map(reaction => `
                    <div class="reaction ${reaction.users.includes('김민준') ? 'active' : ''}" 
                         onclick="chatApp.toggleReaction('${reaction.emoji}', ${JSON.stringify(reaction.users).replace(/"/g, '&quot;')})">
                        <span>${reaction.emoji}</span>
                        <span>${reaction.count}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 반응 추가/제거
    addReaction(messageId, emoji) {
        if (!this.currentRoom) return;
        
        const room = this.chatRooms[this.currentRoom];
        const message = room.messages.find(m => m.id === messageId);
        
        if (!message) return;

        let reaction = message.reactions.find(r => r.emoji === emoji);
        
        if (!reaction) {
            reaction = { emoji, users: [], count: 0 };
            message.reactions.push(reaction);
        }

        const userIndex = reaction.users.indexOf('김민준');
        if (userIndex === -1) {
            reaction.users.push('김민준');
            reaction.count++;
        } else {
            reaction.users.splice(userIndex, 1);
            reaction.count--;
            
            if (reaction.count === 0) {
                message.reactions = message.reactions.filter(r => r !== reaction);
            }
        }

        // 메시지 다시 렌더링
        this.renderMessages(room.messages);
    }

    // 메시지 답장
    replyToMessage(messageId) {
        if (!this.currentRoom) return;
        
        const room = this.chatRooms[this.currentRoom];
        const message = room.messages.find(m => m.id === messageId);
        
        if (!message) return;

        const messageInput = document.getElementById('messageInput');
        const replyText = `@${message.sender} `;
        messageInput.value = replyText;
        messageInput.focus();
        
        // 커서를 끝으로 이동
        messageInput.setSelectionRange(replyText.length, replyText.length);
    }

    // 메시지 수정
    editMessage(messageId) {
        if (!this.currentRoom) return;
        
        const room = this.chatRooms[this.currentRoom];
        const message = room.messages.find(m => m.id === messageId);
        
        if (!message || message.sender !== '김민준' || message.deleted) return;

        // 시간 제한 확인 (5분)
        const timeDiff = (new Date() - message.time) / 1000 / 60;
        if (timeDiff > 5) {
            alert('메시지 수정은 5분 이내에만 가능합니다.');
            return;
        }

        const bubbleElement = document.getElementById(`bubble-${messageId}`);
        const originalContent = message.content;

        // 수정 UI 생성
        bubbleElement.innerHTML = `
            <textarea class="message-edit-input" id="edit-input-${messageId}">${originalContent}</textarea>
            <div class="edit-actions">
                <button class="edit-btn cancel" onclick="chatApp.cancelEdit(${messageId}, '${originalContent.replace(/'/g, "\\'")}')">취소</button>
                <button class="edit-btn save" onclick="chatApp.saveEdit(${messageId})">저장</button>
            </div>
        `;

        // 입력창에 포커스
        const editInput = document.getElementById(`edit-input-${messageId}`);
        editInput.focus();
        editInput.setSelectionRange(originalContent.length, originalContent.length);

        // 엔터키로 저장, ESC로 취소
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveEdit(messageId);
            } else if (e.key === 'Escape') {
                this.cancelEdit(messageId, originalContent);
            }
        });
    }

    // 메시지 수정 저장
    saveEdit(messageId) {
        const editInput = document.getElementById(`edit-input-${messageId}`);
        const newContent = editInput.value.trim();
        
        if (!newContent) {
            alert('메시지 내용을 입력해주세요.');
            return;
        }

        if (!this.currentRoom) return;
        
        const room = this.chatRooms[this.currentRoom];
        const message = room.messages.find(m => m.id === messageId);
        
        if (!message) return;

        // 메시지 수정
        message.content = newContent;
        message.edited = true;
        message.editedTime = new Date();

        // 채팅방 목록의 마지막 메시지 업데이트
        if (room.messages[room.messages.length - 1].id === messageId) {
            room.lastMessage = newContent;
        }

        // UI 업데이트
        this.renderMessages(room.messages);
        this.updateChatList();

        // 스크롤 유지
        setTimeout(() => {
            const messagesArea = document.getElementById('messagesArea');
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 100);
    }

    // 메시지 수정 취소
    cancelEdit(messageId, originalContent) {
        const bubbleElement = document.getElementById(`bubble-${messageId}`);
        bubbleElement.innerHTML = this.formatMessageContent(originalContent);
    }

    // 메시지 삭제
    deleteMessage(messageId) {
        if (!this.currentRoom) return;
        
        const room = this.chatRooms[this.currentRoom];
        const message = room.messages.find(m => m.id === messageId);
        
        if (!message || message.sender !== '김민준') return;

        // 시간 제한 확인 (5분)
        const timeDiff = (new Date() - message.time) / 1000 / 60;
        if (timeDiff > 5) {
            alert('메시지 삭제는 5분 이내에만 가능합니다.');
            return;
        }

        if (confirm('이 메시지를 삭제하시겠습니까?')) {
            // 메시지 삭제 표시
            message.deleted = true;
            message.deletedTime = new Date();
            message.content = '삭제된 메시지입니다';

            // 채팅방 목록의 마지막 메시지 업데이트
            if (room.messages[room.messages.length - 1].id === messageId) {
                // 삭제된 메시지가 마지막 메시지인 경우, 이전 메시지를 찾아서 업데이트
                const nonDeletedMessages = room.messages.filter(m => !m.deleted);
                if (nonDeletedMessages.length > 0) {
                    room.lastMessage = nonDeletedMessages[nonDeletedMessages.length - 1].content;
                } else {
                    room.lastMessage = '삭제된 메시지입니다';
                }
            }

            // UI 업데이트
            this.renderMessages(room.messages);
            this.updateChatList();
        }
    }

    // 메시지 전송
    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content || !this.currentRoom) return;

        const room = this.chatRooms[this.currentRoom];
        const newMessage = {
            id: Date.now(),
            sender: '김민준',
            content: content,
            time: new Date(),
            reactions: []
        };

        room.messages.push(newMessage);
        room.lastMessage = content;
        
        messageInput.value = '';
        this.autoResizeTextarea();
        
        // 메시지 렌더링
        this.renderMessages(room.messages);
        
        // 채팅 목록 업데이트
        this.updateChatList();
        
        // 스크롤을 맨 아래로
        setTimeout(() => {
            const messagesArea = document.getElementById('messagesArea');
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 100);

        // 자동 응답 시뮬레이션
        if (room.type === 'dm') {
            this.simulateAutoReply(this.currentRoom);
        }
    }

    // 자동 응답 시뮬레이션
    simulateAutoReply(roomId) {
        setTimeout(() => {
            const responses = [
                '네, 알겠습니다!',
                '감사합니다 😊',
                '확인했어요',
                '좋은 의견이네요',
                '다음에 자세히 얘기해봐요'
            ];
            
            const room = this.chatRooms[roomId];
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            const replyMessage = {
                id: Date.now(),
                sender: roomId,
                content: response,
                time: new Date(),
                reactions: []
            };

            room.messages.push(replyMessage);
            room.lastMessage = response;
            
            // 현재 채팅방이 열려있으면 메시지 표시
            if (this.currentRoom === roomId) {
                this.renderMessages(room.messages);
                setTimeout(() => {
                    const messagesArea = document.getElementById('messagesArea');
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }, 100);
            } else {
                // 읽지 않은 메시지 수 증가
                room.unreadCount = (room.unreadCount || 0) + 1;
            }
            
            this.updateChatList();
        }, 1000 + Math.random() * 2000);
    }

    // 키 입력 처리
    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    // 타이핑 상태 처리
    handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
        }

        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.isTyping = false;
        }, 1000);
    }

    // 텍스트영역 자동 크기 조절
    autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        
        // 글자 수 표시
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.textContent = `${textarea.value.length}/1000`;
        }
    }

    // 채팅 목록 업데이트
    updateChatList() {
        const favoriteContainer = document.getElementById('favoriteRooms');
        const allRoomsContainer = document.getElementById('allRooms');
        
        // 컨테이너 초기화
        favoriteContainer.innerHTML = '';
        allRoomsContainer.innerHTML = '';

        // 즐겨찾기와 일반 채팅방 분리
        const favoriteRoomsList = [];
        const regularRoomsList = [];

        Object.keys(this.chatRooms).forEach(roomId => {
            // 나간 채팅방은 제외
            if (this.leftRooms.has(roomId)) return;
            
            const room = this.chatRooms[roomId];
            if (this.favoriteRooms.has(roomId)) {
                favoriteRoomsList.push({roomId, room});
            } else {
                regularRoomsList.push({roomId, room});
            }
        });

        // 즐겨찾기 채팅방 렌더링
        favoriteRoomsList.forEach(({roomId, room}) => {
            const roomElement = this.createChatRoomElement(roomId, room);
            favoriteContainer.appendChild(roomElement);
        });

        // 일반 채팅방 렌더링
        regularRoomsList.forEach(({roomId, room}) => {
            const roomElement = this.createChatRoomElement(roomId, room);
            allRoomsContainer.appendChild(roomElement);
        });

        // 즐겨찾기 섹션 표시/숨김
        const favoriteSection = favoriteContainer.closest('.chat-section');
        if (favoriteRoomsList.length === 0) {
            favoriteSection.style.display = 'none';
        } else {
            favoriteSection.style.display = 'block';
        }

        // 전체 읽지 않은 메시지 수 업데이트
        this.updateNotificationBadge();
    }

    // 즐겨찾기 토글
    toggleFavorite(roomId) {
        if (this.favoriteRooms.has(roomId)) {
            this.favoriteRooms.delete(roomId);
        } else {
            this.favoriteRooms.add(roomId);
        }
        this.updateChatList();
        
        // 로컬 스토리지에 저장
        localStorage.setItem('favoriteRooms', JSON.stringify([...this.favoriteRooms]));
    }

    // 채팅방 나가기
    leaveRoom(roomId) {
        const room = this.chatRooms[roomId];
        if (!room) return;

        // 확인 대화상자
        if (confirm(`"${room.name}" 채팅방에서 나가시겠습니까?`)) {
            this.leftRooms.add(roomId);
            
            // 현재 열린 채팅방이면 목록으로 돌아가기
            if (this.currentRoom === roomId) {
                this.backToChatList();
            }
            
            // 즐겨찾기에서도 제거
            this.favoriteRooms.delete(roomId);
            
            this.updateChatList();
            
            // 로컬 스토리지에 저장
            localStorage.setItem('leftRooms', JSON.stringify([...this.leftRooms]));
            localStorage.setItem('favoriteRooms', JSON.stringify([...this.favoriteRooms]));
        }
    }

    // 로컬 스토리지에서 설정 불러오기
    loadSettings() {
        try {
            const savedFavorites = localStorage.getItem('favoriteRooms');
            if (savedFavorites) {
                this.favoriteRooms = new Set(JSON.parse(savedFavorites));
            }

            const savedLeftRooms = localStorage.getItem('leftRooms');
            if (savedLeftRooms) {
                this.leftRooms = new Set(JSON.parse(savedLeftRooms));
            }
        } catch (error) {
            console.warn('설정을 불러오는 중 오류가 발생했습니다:', error);
        }
    }

    // 채팅방 목록 요소 생성
    createChatRoomElement(roomId, room) {
        const roomDiv = document.createElement('div');
        roomDiv.className = `chat-room-item ${this.currentRoom === roomId ? 'active' : ''}`;
        
        const timeText = room.messages.length > 0 
            ? this.formatTime(room.messages[room.messages.length - 1].time)
            : '';

        const isFavorite = this.favoriteRooms.has(roomId);

        roomDiv.innerHTML = `
            <div class="room-avatar">
                ${room.type === 'channel' 
                    ? '<i class="fas fa-hashtag"></i>'
                    : `<img src="${this.users[roomId]?.avatar}" alt="${room.name}">`
                }
            </div>
            <div class="room-info" onclick="chatApp.openChatRoom('${roomId}')">
                <div class="room-name">${room.name}</div>
                <div class="room-preview">${this.truncateText(room.lastMessage || '', 25)}</div>
            </div>
            <div class="room-meta">
                <span class="room-time">${timeText}</span>
                ${room.unreadCount > 0 ? `<span class="unread-count">${room.unreadCount}</span>` : ''}
            </div>
            <div class="room-actions">
                <button class="room-action-btn favorite ${isFavorite ? 'active' : ''}" 
                        onclick="event.stopPropagation(); chatApp.toggleFavorite('${roomId}')" 
                        title="${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
                    <i class="fas fa-star"></i>
                </button>
                ${room.type !== 'channel' ? `
                    <button class="room-action-btn leave" 
                            onclick="event.stopPropagation(); chatApp.leaveRoom('${roomId}')" 
                            title="채팅방 나가기">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `;

        return roomDiv;
    }

    // 알림 배지 업데이트
    updateNotificationBadge() {
        const totalUnread = Object.values(this.chatRooms)
            .reduce((total, room) => total + (room.unreadCount || 0), 0);
        
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            badge.textContent = totalUnread;
            badge.style.display = totalUnread > 0 ? 'block' : 'none';
        });
    }

    // 채팅 검색
    searchChats(query) {
        const chatRoomItems = document.querySelectorAll('.chat-room-item');
        
        chatRoomItems.forEach(item => {
            const roomName = item.querySelector('.room-name').textContent.toLowerCase();
            const roomPreview = item.querySelector('.room-preview').textContent.toLowerCase();
            const searchQuery = query.toLowerCase();
            
            if (roomName.includes(searchQuery) || roomPreview.includes(searchQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // 파일 첨부
    attachFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => this.handleFileUpload(file));
        };
        
        input.click();
    }

    // 파일 업로드 처리
    handleFileUpload(file) {
        if (!this.currentRoom) return;

        const room = this.chatRooms[this.currentRoom];
        const fileMessage = {
            id: Date.now(),
            sender: '김민준',
            content: `📎 ${file.name} (${this.formatFileSize(file.size)})`,
            time: new Date(),
            reactions: [],
            type: 'file',
            file: file
        };

        room.messages.push(fileMessage);
        room.lastMessage = `파일: ${file.name}`;
        
        this.renderMessages(room.messages);
        this.updateChatList();
        
        setTimeout(() => {
            const messagesArea = document.getElementById('messagesArea');
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 100);
    }

    // 자동 응답 시스템
    autoRespond() {
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% 확률로 자동 메시지
                const randomRoom = Object.keys(this.chatRooms)[Math.floor(Math.random() * Object.keys(this.chatRooms).length)];
                const room = this.chatRooms[randomRoom];
                
                if (room.type === 'channel') {
                    const autoMessages = [
                        '새로운 공지사항이 업데이트되었습니다.',
                        '회의실 예약이 완료되었습니다.',
                        '프로젝트 진행 상황을 확인해 주세요.'
                    ];
                    
                    const randomSender = Object.keys(this.users)[Math.floor(Math.random() * Object.keys(this.users).length)];
                    const message = autoMessages[Math.floor(Math.random() * autoMessages.length)];
                    
                    const autoMessage = {
                        id: Date.now(),
                        sender: randomSender,
                        content: message,
                        time: new Date(),
                        reactions: []
                    };

                    room.messages.push(autoMessage);
                    room.lastMessage = message;
                    
                    if (this.currentRoom !== randomRoom) {
                        room.unreadCount = (room.unreadCount || 0) + 1;
                    }
                    
                    if (this.currentRoom === randomRoom) {
                        this.renderMessages(room.messages);
                        setTimeout(() => {
                            const messagesArea = document.getElementById('messagesArea');
                            messagesArea.scrollTop = messagesArea.scrollHeight;
                        }, 100);
                    }
                    
                    this.updateChatList();
                }
            }
        }, 10000); // 10초마다 체크
    }

    // 반응형 처리
    handleResize() {
        if (window.innerWidth > 768 && this.chatOverlay.classList.contains('show')) {
            this.chatOverlay.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    // 유틸리티 함수들
    formatTime(date) {
        if (!(date instanceof Date)) return '';
        
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 1분 미만
            return '방금 전';
        } else if (diff < 3600000) { // 1시간 미만
            return `${Math.floor(diff / 60000)}분 전`;
        } else if (diff < 86400000) { // 24시간 미만
            return `${Math.floor(diff / 3600000)}시간 전`;
        } else {
            return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
        }
    }

    formatMessageContent(content) {
        // URL 링크 변환
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, '<a href="$1" target="_blank" style="color: #3b82f6;">$1</a>');
        
        // 줄바꿈 처리
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// 전역 함수들
function toggleChat() {
    if (window.chatApp) {
        window.chatApp.toggleChat();
    }
}

function openChatRoom(roomId) {
    if (window.chatApp) {
        window.chatApp.openChatRoom(roomId);
    }
}

function backToChatList() {
    if (window.chatApp) {
        window.chatApp.backToChatList();
    }
}

function sendMessage() {
    if (window.chatApp) {
        window.chatApp.sendMessage();
    }
}

function attachFile() {
    if (window.chatApp) {
        window.chatApp.attachFile();
    }
}

function showEmojiPicker() {
    // 이모지 피커 구현 (향후 확장 가능)
    alert('이모지 피커 기능이 곧 추가됩니다!');
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ERPChatApp();
    console.log('ERP 채팅 시스템이 시작되었습니다.');
});
