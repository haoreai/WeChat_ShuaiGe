// 微信聊天界面交互功能（修复移动端键盘遮挡最后一条消息）
class WeChatInterface {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.header = document.querySelector('.chat-header');
        this.inputContainer = document.querySelector('.chat-input-container');

        // 记录初始窗口高度（用于不支持 visualViewport 的浏览器检测键盘高度）
        this._initialInnerHeight = window.innerHeight;
        // 保持消息区底部与输入框的固定间距（px）
        this._gap = 12;
        // 动画时长（ms）
        this._transitionMs = 220;

        this.init();
    }

    init() {
        // 绑定事件
        this.bindEvents();

        // 初始化按钮状态
        this.updateInputActions();

        // 如果存在消息区，先禁用过渡以实现页面首次加载时从底部“跳到”最新消息的体验
        if (this.chatMessages) {
            this.chatMessages.style.transition = 'none';
            this.chatMessages.style.willChange = 'height, padding-bottom';
        }

        // 初始布局并直接跳到底部（无动画），避免页面从顶部开始展示历史消息
        this.onViewportResize();
        this.scrollToBottom(false);

        // 恢复过渡并执行一次平滑滚动，确保最后一条消息与输入框保持适当间距
        setTimeout(() => {
            if (this.chatMessages) {
                this.chatMessages.style.transition = `height ${this._transitionMs}ms ease, padding-bottom ${this._transitionMs}ms ease`;
            }
            this.onViewportResize();
            this.scrollToBottom(true);
        }, Math.max(120, this._transitionMs));

        // 聚焦输入框（可选）
        // this.messageInput.focus();
    }

    bindEvents() {
        // 发送按钮点击事件
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车事件
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框内容变化事件
        this.messageInput.addEventListener('input', () => {
            this.updateInputActions();
            // 在输入变化时也尝试保持可视
            this.scrollToBottom(true);
        });

        // 输入框聚焦时调整视口（处理手机键盘）
        this.messageInput.addEventListener('focus', () => {
            // 给浏览器一点时间弹出键盘后再调整
            setTimeout(() => {
                this.onViewportResize();
                this.scrollToBottom(true);
            }, 50);
        });

        // 失焦时尝试恢复高度
        this.messageInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.onViewportResize();
            }, 50);
        });

        // 工具按钮事件
        this.bindToolEvents();

        // 监听视口变化：优先使用 visualViewport（更准确），降级到 window.resize
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.onViewportResize());
            window.visualViewport.addEventListener('scroll', () => this.onViewportResize());
        } else {
            window.addEventListener('resize', () => this.onViewportResize());
        }

        // 当窗口滚动（某些安卓浏览器会触发）时也调整
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.onViewportResize(), 120);
        });
    }

    bindToolEvents() {
        // 语音按钮
        const voiceBtn = document.querySelector('.voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.showToast('语音功能暂未开放');
            });
        }

        // 表情按钮
        const emojiBtn = document.querySelector('.emoji-btn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => {
                this.showToast('表情功能暂未开放');
            });
        }

        // 添加按钮
        const addBtn = document.querySelector('.add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showToast('更多功能暂未开放');
            });
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 创建消息元素
        this.createMessageElement(message, 'sent');

        // 清空输入框
        this.messageInput.value = '';
        this.updateInputActions();

        // 重新计算并滚动到底部，确保最新消息可见（考虑键盘）
        this.onViewportResize();
        this.scrollToBottom(true);

        // 模拟对方回复
        setTimeout(() => {
            this.simulateReply();
        }, 1000 + Math.random() * 2000);
    }

    createMessageElement(message, type) {
        const messageItem = document.createElement('div');
        messageItem.className = `message-item ${type}`;

        const avatar = type === 'sent' ? 'img/yy.jpg' : 'img/avatar.jpg';
        const altText = type === 'sent' ? '陆砚舟' : '陆浩';

        messageItem.innerHTML = `
            <div class="message-avatar">
                <img src="${avatar}" alt="${altText}">
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${message}
                </div>
            </div>
        `;

        this.chatMessages.appendChild(messageItem);
    }

    simulateReply() {
        const replies = [
            '好的，我知道了',
            '哈哈，有意思',
            '确实是这样',
            '我觉得也是',
            '那就这样吧',
            '没问题',
            '好的好的',
            '明白了',
            '收到',
            '👍'
        ];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        this.createMessageElement(randomReply, 'received');

        // 添加后调整高度并滚动到底部
        this.onViewportResize();
        this.scrollToBottom(true);
    }

    updateInputActions() {
        const hasText = this.messageInput.value.trim().length > 0;
        const sendBtn = document.getElementById('sendBtn');
        const addBtn = document.querySelector('.add-btn');

        if (hasText) {
            // 有文字时显示发送按钮，隐藏加号按钮
            sendBtn.style.display = 'block';
            addBtn.style.display = 'none';
            sendBtn.disabled = false;
        } else {
            // 无文字时隐藏发送按钮，显示加号按钮
            sendBtn.style.display = 'none';
            addBtn.style.display = 'flex';
            sendBtn.disabled = true;
        }
    }

    // 将消息区高度调整为可见视口高度 - header - input 高度，避免键盘遮挡
    onViewportResize() {
        if (!this.chatMessages) return;

        // 计算可用视口高度（优先 visualViewport）
        const vv = window.visualViewport;
        const viewportHeight = vv ? vv.height : window.innerHeight;

        // 获取 header 与 input 高度（如果未找到，使用默认值）
        const headerH = this.header ? this.header.offsetHeight : 64;
        const inputRect = this.inputContainer ? this.inputContainer.getBoundingClientRect() : { height: 72 };
        const inputH = inputRect.height;

        // 保持消息区底部到输入框的固定间距
        const gap = this._gap || 12;

        // 计算可给消息区的高度（减去 gap 留空白），最小高度保护
        let available = Math.max(120, viewportHeight - headerH - inputH - gap);

        // 应用到 chatMessages（使用像素高度以避免浏览器处理 100vh 问题）
        this.chatMessages.style.height = `${available}px`;
        this.chatMessages.style.maxHeight = `${available}px`;
        this.chatMessages.style.overflowY = 'auto';
        // 通过 padding-bottom 保证消息内容与输入框保持固定间距（用于 scrollIntoView）
        this.chatMessages.style.paddingBottom = `${gap}px`;

        // 在 iOS 上，有时 visualViewport offsetTop 会影响可视区域，额外微调高度
        if (vv && typeof vv.offsetTop === 'number' && vv.offsetTop > 0) {
            const extra = vv.offsetTop;
            const newAvailable = Math.max(120, available - extra);
            this.chatMessages.style.height = `${newAvailable}px`;
            this.chatMessages.style.maxHeight = `${newAvailable}px`;
        }

        // 不支持 visualViewport 的浏览器，使用初始 innerHeight 作为键盘检测的回退方案
        if (!vv && typeof this._initialInnerHeight === 'number') {
            const keyboardHeight = Math.max(0, this._initialInnerHeight - window.innerHeight);
            if (keyboardHeight > 100) {
                // 认为键盘已弹起，进一步调整高度（已包含 gap）
                const newAvailable = Math.max(120, window.innerHeight - headerH - inputH - gap);
                this.chatMessages.style.height = `${newAvailable}px`;
                this.chatMessages.style.maxHeight = `${newAvailable}px`;
            } else {
                // 恢复到未弹起时的高度（平滑过渡）
                const restoreAvailable = Math.max(120, window.innerHeight - headerH - inputH - gap);
                this.chatMessages.style.height = `${restoreAvailable}px`;
                this.chatMessages.style.maxHeight = `${restoreAvailable}px`;
            }
        }
    }

    // 滚动到底部，优先使用自定义偏移保证最后一个气泡与输入框保持固定间距
    scrollToBottom(smooth = false) {
        // 等待布局稳定
        setTimeout(() => {
            const messages = this.chatMessages.querySelectorAll('.message-item, .message-time');
            if (!messages || messages.length === 0) {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                return;
            }
            try {
                this.scrollLastIntoViewWithGap(smooth);
            } catch (e) {
                // 回退到简单滚动
                try {
                    const last = messages[messages.length - 1];
                    last.scrollIntoView({
                        behavior: smooth ? 'smooth' : 'auto',
                        block: 'end',
                        inline: 'nearest'
                    });
                } catch (err) {
                    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                }
            }
        }, 80);
    }

    // 将最后一个消息滚动到可视区域底部，并与输入框保持固定间距（兼容不同设备键盘高度）
    scrollLastIntoViewWithGap(smooth = false) {
        const messages = this.chatMessages.querySelectorAll('.message-item, .message-time');
        if (!messages || messages.length === 0) return;

        const last = messages[messages.length - 1];
        const gap = this._gap || 12;

        // 使用 offsetTop/offsetHeight 计算相对于容器的目标 scrollTop
        const desired = last.offsetTop + last.offsetHeight - this.chatMessages.clientHeight + gap;

        // 边界保护
        const maxScroll = this.chatMessages.scrollHeight - this.chatMessages.clientHeight;
        let target = Math.min(Math.max(0, desired), Math.max(0, maxScroll));

        // 如果最后一条已经可见且距离底部 >= gap，则无需滚动（避免多余动画）
        const lastBottom = last.offsetTop + last.offsetHeight;
        const visibleBottom = this.chatMessages.scrollTop + this.chatMessages.clientHeight;
        if (lastBottom <= visibleBottom && (visibleBottom - lastBottom) >= gap) {
            return;
        }

        if (smooth && 'scrollTo' in this.chatMessages) {
            this.chatMessages.scrollTo({ top: target, behavior: 'smooth' });
        } else {
            this.chatMessages.scrollTop = target;
        }
    }

    showToast(message) {
        // 创建简单的提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 9999;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 2000);
    }

    // 获取当前时间字符串
    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // 添加时间戳
    addTimeStamp() {
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.innerHTML = `<span>${this.getCurrentTime()}</span>`;
        this.chatMessages.appendChild(timeElement);
    }
}

// 页面加载完成后初始化 WeChatInterface
document.addEventListener('DOMContentLoaded', () => {
    new WeChatInterface();
});

// 处理图片加载错误
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG' && !e.target.classList.contains('photo-image')) {
        // 使用默认头像
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNiIgZmlsbD0iI0Y1RjVGNSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjE2IiByPSI2IiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik0xMCAzMkMxMCAyNi40NzcyIDEzLjU4MTcgMjIgMjAgMjJDMjYuNDE4MyAyMiAzMCAyNi40NzcyIDMwIDMySDEwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8L3N2Zz4K';
    }
}, true);

// 照片查看器功能
class PhotoViewer {
    constructor() {
        this.createViewer();
        this.bindEvents();
    }

    createViewer() {
        // 创建照片查看器遮罩层
        const viewer = document.createElement('div');
        viewer.className = 'photo-viewer';
        viewer.innerHTML = '<img src="" alt="查看照片">';
        document.body.appendChild(viewer);
        this.viewer = viewer;
        this.viewerImg = viewer.querySelector('img');
    }

    bindEvents() {
        // 绑定照片点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('photo-image')) {
                this.showPhoto(e.target.src);
            }
        });

        // 点击遮罩层关闭
        this.viewer.addEventListener('click', () => {
            this.hidePhoto();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.viewer.classList.contains('show')) {
                this.hidePhoto();
            }
        });
    }

    showPhoto(src) {
        this.viewerImg.src = src;
        this.viewer.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hidePhoto() {
        this.viewer.classList.remove('show');
        document.body.style.overflow = '';
    }
}

 // 音乐播放器功能（改进版：统一 Audio 管理、进度条、拖拽、UI 同步）
class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.preload = 'metadata';
        this.currentCard = null;
        this.raf = null;
        this.dragging = false;
        this.bindEvents();
    }

    bindEvents() {
        // 委托：匹配 compact / legacy music 卡片
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.music-card-compact, .music-card');
            if (!card) return;

            // 如果点击的是内置播放按钮（圆形），优先处理
            const playBtn = e.target.closest('.play-circle, .play-button, .play-icon');
            if (playBtn) {
                this.handleToggle(card);
                return;
            }

            // 点击卡片任意区域也可以切换播放
            this.handleToggle(card);
        });

        // 在文档中处理进度条的交互（点击与拖拽）
        document.addEventListener('pointerdown', (e) => {
            const prog = e.target.closest('.music-progress');
            if (!prog) return;
            e.preventDefault();
            this.onProgressPointerDown(e, prog);
        });

        // 全局 pointermove / up 事件用于拖拽
        document.addEventListener('pointermove', (e) => {
            if (!this.dragging || !this.dragging.prog) return;
            this.onProgressPointerMove(e);
        });
        document.addEventListener('pointerup', (e) => {
            if (!this.dragging || !this.dragging.prog) return;
            this.onProgressPointerUp(e);
        });

        // audio 事件：timeupdate / ended / loadedmetadata / error
        this.audio.addEventListener('timeupdate', () => this.updateProgressUI());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('loadedmetadata', () => this.updateProgressUI());
        this.audio.addEventListener('error', (e) => {
            console.error('音频错误', e);
            this.showToast('音频加载失败');
            this.resetCurrentCard();
        });
    }

    // 切换播放：如果是同一张卡则切换播放/暂停，否则加载并播放新音频
    handleToggle(card) {
        const src = card.getAttribute('data-music');
        if (!src) return;
        if (this.currentCard === card) {
            if (this.audio.paused) {
                this.audio.play().catch((err) => {
                    console.error('播放失败', err);
                    this.showToast('播放失败');
                });
                this.setPlayingState(card, true);
            } else {
                this.audio.pause();
                this.setPlayingState(card, false);
            }
            return;
        }

        // 切换到新卡片
        this.resetCurrentCard();
        this.prepareCardUI(card);
        this.currentCard = card;
        this.audio.src = src;
        this.audio.currentTime = 0;
        this.audio.play().then(() => {
            this.setPlayingState(card, true);
        }).catch((err) => {
            console.error('播放失败', err);
            this.showToast('播放失败');
            this.setPlayingState(card, false);
        });
    }

    // 为卡片准备进度条与控件（只做一次）
    prepareCardUI(card) {
        // 若已有进度条则跳过
        if (!card.querySelector('.music-progress')) {
            const center = card.querySelector('.compact-center') || card.querySelector('.music-info');
            if (center) {
                const prog = document.createElement('div');
                prog.className = 'music-progress';
                prog.innerHTML = `
                    <div class="music-progress-bar" aria-hidden="true"></div>
                    <div class="music-progress-handle" aria-hidden="true"></div>
                `;
                // 将进度条插入到 center 的底部
                center.appendChild(prog);

                // 简要样式（若需要更复杂请放到 css）
                const style = document.createElement('style');
                style.textContent = `
                    .music-progress {
                        position: relative;
                        height: 6px;
                        background: rgba(0,0,0,0.04);
                        border-radius: 6px;
                        margin-top: 8px;
                        cursor: pointer;
                        overflow: hidden;
                    }
                    .music-progress-bar {
                        position: absolute;
                        left: 0;
                        top: 0;
                        height: 100%;
                        width: 0%;
                        background: linear-gradient(90deg, #07c160 0%, #06ad56 100%);
                        transition: width 120ms linear;
                    }
                    .music-progress-handle {
                        position: absolute;
                        top: 50%;
                        transform: translate(-50%,-50%);
                        left: 0%;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #fff;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
                        transition: left 120ms linear;
                    }
                    @media (prefers-color-scheme: dark) {
                        .music-progress { background: rgba(255,255,255,0.04); }
                        .music-progress-handle { background: #111; box-shadow: 0 2px 6px rgba(0,0,0,0.6); }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        // 确保播放按钮存在（compact 与 legacy 两种）
        let playBtn = card.querySelector('.play-circle, .play-button, .play-icon');
        if (!playBtn) {
            // 如果没有内置按钮，则创建一个小型播放按钮放到右侧
            const right = card.querySelector('.compact-right') || card;
            const btn = document.createElement('button');
            btn.className = 'play-circle';
            btn.setAttribute('aria-label', '播放');
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
            right.appendChild(btn);
        }
    }

    // 更新播放状态样式
    setPlayingState(card, playing) {
        // 更新按钮外观（将按钮置为播放/暂停状态）
        if (!card) return;
        card.classList.toggle('playing', playing);
        const playCircle = card.querySelector('.play-circle');
        if (playCircle) {
            if (playing) {
                playCircle.style.background = 'linear-gradient(135deg,#1db954 0%, #07c160 100%)';
                playCircle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            } else {
                playCircle.style.background = 'linear-gradient(135deg,#07c160 0%, #06ad56 100%)';
                playCircle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
            }
        }

        // legacy play-icon 兼容：切换类名
        const legacyIcon = card.querySelector('.play-icon');
        if (legacyIcon) {
            legacyIcon.className = playing ? 'play-icon pause' : 'play-icon play';
        }

        // 启动或停止进度帧更新
        if (playing) {
            this.startProgressLoop();
        } else {
            this.stopProgressLoop();
        }
    }

    // 循环更新进度条（使用 requestAnimationFrame）
    startProgressLoop() {
        if (this.raf) cancelAnimationFrame(this.raf);
        const loop = () => {
            this.updateProgressUI();
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    stopProgressLoop() {
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
    }

    // 更新进度条 UI（基于 this.audio.currentTime / duration）
    updateProgressUI() {
        if (!this.currentCard || !this.audio || !this.audio.duration || isNaN(this.audio.duration)) return;
        const prog = this.currentCard.querySelector('.music-progress');
        if (!prog) return;
        const percent = Math.max(0, Math.min(1, this.audio.currentTime / this.audio.duration));
        const bar = prog.querySelector('.music-progress-bar');
        const handle = prog.querySelector('.music-progress-handle');
        if (bar) bar.style.width = (percent * 100) + '%';
        if (handle) handle.style.left = (percent * 100) + '%';
    }

    // 结束时重置 UI
    onEnded() {
        if (!this.currentCard) return;
        this.setPlayingState(this.currentCard, false);
        // 重置进度
        const prog = this.currentCard.querySelector('.music-progress');
        if (prog) {
            const bar = prog.querySelector('.music-progress-bar');
            const handle = prog.querySelector('.music-progress-handle');
            if (bar) bar.style.width = '0%';
            if (handle) handle.style.left = '0%';
        }
        this.audio.currentTime = 0;
        this.resetCurrentCard();
    }

    // pointer down - 开始拖拽或点击进度条
    onProgressPointerDown(ev, prog) {
        ev.preventDefault();
        this.dragging = { prog, startX: ev.clientX || (ev.touches && ev.touches[0] && ev.touches[0].clientX) || 0 };
        // 临时暂停更新循环以避免冲突
        this.stopProgressLoop();
        // 立刻处理一次位置（支持点击）
        this.seekByPointer(ev, prog);
    }

    onProgressPointerMove(ev) {
        if (!this.dragging || !this.dragging.prog) return;
        this.seekByPointer(ev, this.dragging.prog, false);
    }

    onProgressPointerUp(ev) {
        if (!this.dragging || !this.dragging.prog) return;
        // 最后一次 seek 并恢复播放（如果之前是播放状态）
        this.seekByPointer(ev, this.dragging.prog, true);
        this.dragging = false;
        if (!this.audio.paused) this.startProgressLoop();
    }

    // 根据指针位置计算并跳转
    seekByPointer(ev, prog, setCurrent = true) {
        const rect = prog.getBoundingClientRect();
        const clientX = ev.clientX !== undefined ? ev.clientX : (ev.touches && ev.touches[0] && ev.touches[0].clientX) || 0;
        let pct = (clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        const bar = prog.querySelector('.music-progress-bar');
        const handle = prog.querySelector('.music-progress-handle');
        if (bar) bar.style.width = (pct * 100) + '%';
        if (handle) handle.style.left = (pct * 100) + '%';
        if (setCurrent && this.audio.duration && !isNaN(this.audio.duration)) {
            this.audio.currentTime = pct * this.audio.duration;
        }
    }

    resetCurrentCard() {
        if (this.currentCard) {
            this.setPlayingState(this.currentCard, false);
            this.currentCard = null;
        }
        this.stopProgressLoop();
    }

    // 简单提示
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 9999;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 1600);
    }
}

 // 初始化照片查看器和音乐播放器
document.addEventListener('DOMContentLoaded', () => {
    new PhotoViewer();
    new MusicPlayer();
});

/* 开发者工具打开时在控制台输出开发者信息（兼容 Chrome / Firefox / Safari）
   要求：使用 console.log，输出清晰且不与其他日志混淆
*/
(function devtoolsLogger(){
    const info = {
        author: '陆砚舟',
        blog: 'https://www.haoreai.com',
        version: 'v1.3'
    };

    let logged = false;

    function output() {
        if (logged) return;
        logged = true;
        // 使用分行的 console.log 保证可读性且仅使用 console.log（不使用 console.group）
        console.log('%c开发者信息', 'font-weight:700;font-size:13px;color:#07c160;');
        console.log('作者：%s', info.author);
        console.log('个人博客：%s', info.blog);
        console.log('版本：%s', info.version);
    }

    // 简单但兼容性较好的检测：比较 outer 与 inner 的尺寸差（常见于打开 DevTools）
    function isDevToolsOpen() {
        try {
            const threshold = 160; // 经验值，兼容常见浏览器窗口和面板大小
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;
            return (widthDiff > threshold) || (heightDiff > threshold);
        } catch (e) {
            return false;
        }
    }

    // 周期性检查（防止 missing 事件），以及监听 resize（更及时）
    const interval = setInterval(() => {
        if (isDevToolsOpen()) {
            output();
            clearInterval(interval);
        }
    }, 800);

    window.addEventListener('resize', () => {
        if (isDevToolsOpen()) {
            output();
            clearInterval(interval);
        }
    });

    // 额外尝试：利用向控制台 log 一个带 getter 的对象 —— 在某些浏览器打开控制台时会触发 getter
    try {
        const probe = {};
        Object.defineProperty(probe, 'devtoolsProbe', {
            get: function() {
                output();
                return true;
            },
            configurable: true
        });
        // 仅调用 console.log 一次，避免造成大量日志噪声
        // 在打开控制台时，某些浏览器会访问对象属性来显示更友好的可视化，从而触发 getter
        console.log(probe);
    } catch (e) {
        // 忽略任何兼容性问题
    }

})();
