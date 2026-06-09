document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Toast Notification System
    // ----------------------------------------------------
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'info') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        // Tailwind styling compatible with the theme
        toast.className = `pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border border-outline-variant/30 transition-all duration-300 transform translate-y-4 opacity-0 text-on-surface font-body-md min-w-[300px] max-w-sm bg-white/90 dark:bg-surface-container-lowest/90 backdrop-blur-xl`;

        let icon = 'info';
        let iconColor = 'text-primary';

        if (type === 'success') {
            icon = 'check_circle';
            iconColor = 'text-secondary';
        } else if (type === 'error') {
            icon = 'error';
            iconColor = 'text-error';
        } else if (type === 'warning') {
            icon = 'warning';
            iconColor = 'text-outline';
        }

        toast.innerHTML = `
            <span class="material-symbols-outlined ${iconColor}">${icon}</span>
            <span class="flex-1 text-[15px] font-medium leading-normal">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        }, 50);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('-translate-y-4', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Export showToast to window so inline elements can use it if needed
    window.showToast = showToast;

    // ----------------------------------------------------
    // 2. Interactive Scale Effects for Cards
    // ----------------------------------------------------
    document.querySelectorAll('.card-hover').forEach(card => {
        card.addEventListener('mousedown', () => {
            card.style.transform = 'scale(0.98)';
        });
        card.addEventListener('mouseup', () => {
            card.style.transform = 'translateY(-4px) scale(1.01)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // ----------------------------------------------------
    // 3. Smooth Entrance for Section Items (IntersectionObserver)
    // ----------------------------------------------------
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-8');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
        observer.observe(section);
    });

    // ----------------------------------------------------
    // 4. D-Day Widget Interactivity
    // ----------------------------------------------------
    const btnWeather = document.getElementById('btn-weather');
    const btnChecklist = document.getElementById('btn-checklist');
    const expansionPanel = document.getElementById('dday-expansion-panel');
    const weatherContent = document.getElementById('content-weather');
    const checklistContent = document.getElementById('content-checklist');

    let currentActive = 'weather'; // Weather open by default in original html active class

    function togglePanel(type) {
        if (currentActive === type) {
            // Close panel
            expansionPanel.classList.remove('active');
            setTimeout(() => {
                weatherContent.classList.add('hidden');
                checklistContent.classList.add('hidden');
            }, 400);
            currentActive = null;
        } else {
            // Switch content or open
            weatherContent.classList.add('hidden');
            checklistContent.classList.add('hidden');
            
            if (type === 'weather') {
                weatherContent.classList.remove('hidden');
            } else {
                checklistContent.classList.remove('hidden');
            }
            
            expansionPanel.classList.add('active');
            currentActive = type;
            
            // Scroll into view slightly if mobile
            if (window.innerWidth < 768) {
                expansionPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    if (btnWeather) btnWeather.addEventListener('click', () => togglePanel('weather'));
    if (btnChecklist) btnChecklist.addEventListener('click', () => togglePanel('checklist'));

    // D-Day Widget checklist interaction (Check/Uncheck effect)
    const checklistItems = document.querySelectorAll('#content-checklist ul li');
    checklistItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const checkbox = item.querySelector('div');
            const hasCheck = checkbox.querySelector('span');
            
            if (hasCheck) {
                // Uncheck
                checkbox.innerHTML = '';
                item.querySelector('span:not(.material-symbols-outlined)').classList.add('text-white/60', 'line-through');
                showToast('체크리스트 항목을 해제했습니다.', 'info');
            } else {
                // Check
                checkbox.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';
                checkbox.classList.add('flex', 'items-center', 'justify-center');
                item.querySelector('span:not(.material-symbols-outlined)').classList.remove('text-white/60', 'line-through');
                showToast('체크리스트 항목을 완료했습니다!', 'success');
            }
        });
    });

    // ----------------------------------------------------
    // 5. Plan Modal Functionality
    // ----------------------------------------------------
    const planModal = document.getElementById('plan-modal');
    const openModalBtn = document.getElementById('open-plan-modal');
    const closeModalBtn = document.getElementById('close-plan-modal');
    const cancelModalBtn = document.getElementById('cancel-plan-btn');
    const addPlanForm = document.getElementById('add-plan-form');
    const plansList = document.getElementById('plans-list');
    const modalContent = planModal ? planModal.querySelector('.modal-content') : null;

    function openModal() {
        if (!planModal || !modalContent) return;
        planModal.classList.remove('hidden');
        setTimeout(() => {
            planModal.classList.add('opacity-100');
            modalContent.classList.remove('opacity-0', 'scale-95');
            modalContent.classList.add('opacity-100', 'scale-100');
        }, 10);
        document.body.style.overflow = 'hidden';
        const titleInput = document.getElementById('plan-title');
        if (titleInput) titleInput.focus();
    }

    function closeModal() {
        if (!planModal || !modalContent) return;
        planModal.classList.remove('opacity-100');
        modalContent.classList.remove('opacity-100', 'scale-100');
        modalContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            planModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            if (addPlanForm) addPlanForm.reset();
        }, 300);
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    if (planModal) {
        planModal.addEventListener('click', (e) => {
            if (e.target === planModal) closeModal();
        });
    }

    // Form Submission
    if (addPlanForm) {
        addPlanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('plan-title').value;
            const budgetInput = document.getElementById('plan-budget').value;
            const budget = parseInt(budgetInput).toLocaleString();
            const duration = document.getElementById('plan-duration').value;
            const imageUrl = document.getElementById('plan-image').value || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=300&h=300";

            // Create New Plan Element
            const newPlan = document.createElement('div');
            newPlan.className = "group flex items-center gap-6 p-4 rounded-3xl bg-white border border-outline-variant/20 hover:border-primary/30 transition-all shadow-sm opacity-0 translate-y-4";
            newPlan.innerHTML = `
                <div class="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                    <img alt="${title} 대표 이미지" class="w-full h-full object-cover" src="${imageUrl}">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 mb-1">
                        <h4 class="font-title-md text-on-surface truncate">${title}</h4>
                        <span class="text-[12px] bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-bold">방금 생성</span>
                    </div>
                    <p class="text-on-surface-variant font-body-md mb-2">예상 예산: ${budget}원 • ${duration}일</p>
                    <div class="flex items-center gap-4">
                        <span class="flex items-center gap-1 text-[13px] text-outline"><span class="material-symbols-outlined text-[16px]">edit_calendar</span> 방금 전 수정</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button aria-label="삭제" class="p-3 rounded-full hover:bg-error-container/20 hover:text-error text-on-surface-variant transition-colors">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                    <button class="bg-primary text-white px-5 py-2 rounded-full font-label-sm hover:scale-105 transition-transform btn-continue">계속하기</button>
                </div>
            `;

            if (plansList) {
                // Append with Animation
                plansList.prepend(newPlan);
                
                setTimeout(() => {
                    newPlan.classList.remove('opacity-0', 'translate-y-4');
                    newPlan.classList.add('opacity-100', 'translate-y-0');
                    showToast(`"${title}" 계획을 새로 추가했습니다!`, 'success');
                }, 50);
            }

            closeModal();
        });
    }

    // Accessibility: Keyboard close
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && planModal && !planModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Handle Deletion in Saved Plans List
    if (plansList) {
        plansList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('button[aria-label="삭제"]');
            if (deleteBtn) {
                const card = deleteBtn.closest('.group');
                const title = card.querySelector('h4').textContent;
                
                if (confirm(`"${title}" 계획을 삭제하시겠습니까?`)) {
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        card.remove();
                        showToast(`"${title}" 계획이 삭제되었습니다.`, 'warning');
                    }, 300);
                }
            }

            // Bind newly added 'Continue' buttons
            const continueBtn = e.target.closest('.btn-continue');
            if (continueBtn) {
                const card = continueBtn.closest('.group');
                const title = card.querySelector('h4').textContent;
                showToast(`"${title}" 계획 작성을 이어서 시작합니다.`, 'success');
            }
        });
    }

    // ----------------------------------------------------
    // 6. Navigation Tabs Scroll & Active State Toggle
    // ----------------------------------------------------
    const navLinks = document.querySelectorAll('aside nav a[data-tab]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get target section id
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Smooth scroll to target section
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Toggle active menu state
                navLinks.forEach(l => {
                    l.className = "w-full flex items-center gap-4 px-4 py-4 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all font-body-md group";
                    const icon = l.querySelector('.material-symbols-outlined');
                    if (icon) icon.style.fontVariationSettings = '"FILL" 0';
                });
                
                link.className = "w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-primary-container text-on-primary-container font-title-md transition-all shadow-sm";
                const activeIcon = link.querySelector('.material-symbols-outlined');
                if (activeIcon) activeIcon.style.fontVariationSettings = '"FILL" 1';
                
                showToast(`"${link.textContent.trim()}" 메뉴로 이동했습니다.`, 'info');
            }
        });
    });

    // ----------------------------------------------------
    // 7. Click Interaction Event Binding for Various Buttons
    // ----------------------------------------------------
    
    // Notification Icon
    const btnNotifications = document.getElementById('btn-notifications');
    if (btnNotifications) {
        btnNotifications.addEventListener('click', () => {
            showToast('새로운 알림이 없습니다.', 'info');
        });
    }

    // ----------------------------------------------------
    // 8. Profile Edit Modal
    // ----------------------------------------------------
    const profileModal = document.getElementById('profile-modal');
    const editProfileForm = document.getElementById('edit-profile-form');
    const closeProfileModalBtn = document.getElementById('close-profile-modal');
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');
    const profileModalContent = profileModal ? profileModal.querySelector('.modal-content') : null;

    // DOM targets to update on save
    const displayName = document.getElementById('profile-display-name');
    const displayLocation = document.getElementById('profile-display-location');
    const displayBio = document.getElementById('profile-display-bio');
    const displayAvatar = document.getElementById('profile-display-avatar');
    const headerAvatar = document.getElementById('header-display-avatar');

    function openProfileModal() {
        if (!profileModal || !profileModalContent) return;

        // Pre-fill form with current displayed values
        const nameInput = document.getElementById('profile-name');
        const locationInput = document.getElementById('profile-location');
        const bioInput = document.getElementById('profile-bio');
        const avatarInput = document.getElementById('profile-avatar-url');

        if (nameInput && displayName) nameInput.value = displayName.textContent.trim();
        if (locationInput && displayLocation) locationInput.value = displayLocation.textContent.trim();
        if (bioInput && displayBio) bioInput.value = displayBio.textContent.trim();
        if (avatarInput && displayAvatar) avatarInput.value = displayAvatar.src || '';

        profileModal.classList.remove('hidden');
        setTimeout(() => {
            profileModal.classList.add('opacity-100');
            profileModalContent.classList.remove('opacity-0', 'scale-95');
            profileModalContent.classList.add('opacity-100', 'scale-100');
        }, 10);
        document.body.style.overflow = 'hidden';
        if (nameInput) nameInput.focus();
    }

    function closeProfileModal() {
        if (!profileModal || !profileModalContent) return;
        profileModal.classList.remove('opacity-100');
        profileModalContent.classList.remove('opacity-100', 'scale-100');
        profileModalContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            profileModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // Open modal on profile edit / avatar edit button clicks
    const btnEditProfile = document.getElementById('btn-edit-profile');
    if (btnEditProfile) {
        btnEditProfile.addEventListener('click', openProfileModal);
    }

    const btnEditAvatar = document.getElementById('btn-edit-avatar');
    if (btnEditAvatar) {
        btnEditAvatar.addEventListener('click', openProfileModal);
    }

    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeProfileModal);
    if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', closeProfileModal);

    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) closeProfileModal();
        });
    }

    // ESC key to close profile modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && profileModal && !profileModal.classList.contains('hidden')) {
            closeProfileModal();
        }
    });

    // Save profile on form submit
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newName = document.getElementById('profile-name').value.trim();
            const newLocation = document.getElementById('profile-location').value.trim();
            const newBio = document.getElementById('profile-bio').value.trim();
            const newAvatarUrl = document.getElementById('profile-avatar-url').value.trim();

            // Update displayed profile info
            if (displayName && newName) displayName.textContent = newName;
            if (displayLocation && newLocation) displayLocation.textContent = newLocation;
            if (displayBio && newBio) displayBio.textContent = newBio;

            // Update avatar images if URL is provided
            if (newAvatarUrl) {
                if (displayAvatar) displayAvatar.src = newAvatarUrl;
                if (headerAvatar) headerAvatar.src = newAvatarUrl;
            }

            closeProfileModal();
            showToast('프로필이 성공적으로 수정되었습니다!', 'success');
        });
    }

    // Sidebar Additional Menus
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            showToast('설정 페이지 준비 중입니다.', 'warning');
        });
    }

    const btnBilling = document.getElementById('btn-billing');
    if (btnBilling) {
        btnBilling.addEventListener('click', () => {
            showToast('결제 및 멤버십 관리 서비스 준비 중입니다.', 'warning');
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                showToast('성공적으로 로그아웃되었습니다.', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        });
    }

    // AI Assistant Quick Start
    const btnAiStart = document.getElementById('btn-ai-start');
    if (btnAiStart) {
        btnAiStart.addEventListener('click', () => {
            showToast('AI 맞춤형 제주도 여행 추천 계획을 수립합니다.', 'success');
        });
    }

    // Booking management inside Featured Trip Card
    const btnManageBooking = document.getElementById('btn-manage-booking');
    if (btnManageBooking) {
        btnManageBooking.addEventListener('click', () => {
            showToast('제주도 푸른 밤 투어 예약 관리 내역을 불러옵니다.', 'info');
        });
    }

    // Existing static plans "Continue" button
    document.querySelectorAll('.btn-continue-static').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.group');
            const title = card.querySelector('h4').textContent;
            showToast(`"${title}" 계획 작성을 이어서 시작합니다.`, 'success');
        });
    });

    // Action buttons: Memories view and review write
    document.querySelectorAll('.btn-view-memory').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.group');
            const title = card.querySelector('h4').textContent;
            showToast(`"${title}"의 사진첩과 기록을 불러옵니다.`, 'success');
        });
    });

    document.querySelectorAll('.btn-write-review').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.group');
            const title = card.querySelector('h4').textContent;
            showToast(`"${title}"에 대한 여행 리뷰 작성을 시작합니다.`, 'info');
        });
    });

    // Mobile Bottom Navigation Buttons
    const mobileNavButtons = document.querySelectorAll('nav.md\\:hidden button');
    mobileNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.querySelector('span:not(.material-symbols-outlined)').textContent;
            
            // Toggle highlight
            mobileNavButtons.forEach(b => {
                b.className = "flex flex-col items-center gap-1 text-on-surface-variant";
                const icon = b.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = '"FILL" 0';
            });
            
            btn.className = "flex flex-col items-center gap-1 text-primary";
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = '"FILL" 1';

            showToast(`모바일 ${text} 메뉴로 진입했습니다.`, 'info');
        });
    });
});
