document.addEventListener('DOMContentLoaded', () => {
    // 启动所有功能模块
    App.initAuth();
    App.initShoppingList();
    App.initMealPlanner();
    App.initRecipeForm();
    App.initRecipeDetail();
    App.initAnalytics();
});

const App = {
    // === 1. 基础配置 ===
    CONFIG: {
        ANIMATION_SPEED: 200,
        MOCK_DELAY: 1500
    },

    // === 2. 注册与认证模块 ===
    initAuth() {
        const signupForm = document.querySelector('#signupSection form');
        if (!signupForm) return;

        const password = document.getElementById('signupPassword');
        const confirm = document.getElementById('confirmPassword');

        const validateInput = (el, condition) => {
            if (el.value === '') el.className = 'form-control';
            else el.className = condition ? 'form-control is-valid' : 'form-control is-invalid';
        };

        password?.addEventListener('input', () =>
            validateInput(password, password.value.length >= 8 && /\d/.test(password.value))
        );

        confirm?.addEventListener('input', () =>
            validateInput(confirm, confirm.value === password.value && confirm.value !== '')
        );

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.clearErrors();

            let isValid = true;
            if (!password.classList.contains('is-valid')) {
                this.showError(password, 'Password needs 8+ chars & a number.');
                isValid = false;
            }
            if (password.value !== confirm.value) {
                this.showError(confirm, 'Passwords do not match.');
                isValid = false;
            }

            if (isValid) {
                await this.handleFormSubmit(signupForm, 'CREATING ACCOUNT...', 'Account created successfully!');
            }
        });

        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.previousElementSibling;
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                this.innerHTML = isPass ? '👁️' : '🙈';
            });
        });
    },

    // === 3. 购物清单模块 ===
    initShoppingList() {
        const list = document.getElementById('shoppingListGroup');
        if (!list) return;

        this.updateShoppingStats();

        list.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                this.toggleListItemState(e.target, 'item-completed');
                this.updateShoppingStats();
            }
        });

        list.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const label = e.target.closest('.list-group-item').querySelector('.item-label');
                const newName = prompt("Edit item name:", label.innerText);
                if (newName?.trim()) label.innerText = newName.trim();
            }
        });
    },

    // === 4. 菜谱详情模块 (智能勾选) ===
    initRecipeDetail() {
        const detailList = document.getElementById('recipeIngredients');
        const addBtn = document.getElementById('addToListBtn');
        if (!detailList || !addBtn) return;

        detailList.addEventListener('change', (e) => {
            if (e.target.classList.contains('detail-checkbox')) {
                this.toggleListItemState(e.target, 'item-selected');
            }
        });

        addBtn.addEventListener('click', () => {
            const boxes = detailList.querySelectorAll('.detail-checkbox');
            let checked = Array.from(boxes).filter(b => b.checked);

            if (checked.length === 0) {
                boxes.forEach(b => {
                    b.checked = true;
                    this.toggleListItemState(b, 'item-selected');
                });
                checked = boxes;
            }

            addBtn.className = 'btn btn-success text-white fw-bold rounded-pill px-3';
            addBtn.innerText = `✓ ADDED ${checked.length} ITEMS`;
            this.toast(`Added ${checked.length} ingredients to your list.`);
        });
    },

    // === 5. 动态表单模块 (Add Recipe) ===
    initRecipeForm() {
        const form = document.getElementById('addRecipeForm');
        if (!form) return;

        const setupDynamicRows = (btnId, containerId, templateFunc) => {
            const btn = document.getElementById(btnId);
            const container = document.getElementById(containerId);
            if (!btn || !container) return;

            btn.addEventListener('click', () => {
                const div = document.createElement('div');
                div.innerHTML = templateFunc(container.children.length + 1);
                container.appendChild(div.firstElementChild);
                this.manageRemoveButtons(container);
            });
        };

        setupDynamicRows('addIngredientBtn', 'ingredientsContainer', () => `
            <div class="d-flex gap-2 mb-2 ingredient-row transition-all">
                <input type="text" class="form-control bg-light border-0 w-25" placeholder="Amount">
                <input type="text" class="form-control bg-light border-0 w-25" placeholder="Unit">
                <input type="text" class="form-control bg-light border-0 w-50" placeholder="Ingredient">
                <button type="button" class="btn btn-outline-danger border-0 remove-row-btn">✕</button>
            </div>
        `);

        setupDynamicRows('addStepBtn', 'stepsContainer', (num) => `
            <div class="d-flex gap-3 mb-3 step-row transition-all align-items-start">
                <div class="step-number bg-dark text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style="width:32px;height:32px;">${num}</div>
                <textarea class="form-control bg-light border-0 flex-grow-1" rows="2"></textarea>
                <button type="button" class="btn btn-outline-danger border-0 remove-row-btn mt-1">✕</button>
            </div>
        `);

        form.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-row-btn')) {
                const row = e.target.closest('.d-flex');
                const container = row.parentNode;
                row.style.opacity = '0';
                setTimeout(() => {
                    row.remove();
                    if (container.id === 'stepsContainer') this.reorderSteps(container);
                    this.manageRemoveButtons(container);
                }, this.CONFIG.ANIMATION_SPEED);
            }
        });

        // 为创建菜谱表单添加提交监听
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // 如果你 HTML 里有必填项(required)，浏览器会自动检查。通过检查后才会运行下面这行
            await this.handleFormSubmit(form, 'SAVING...', 'Recipe saved successfully!');
            // 模拟 2 秒后跳回菜谱库
            setTimeout(() => {
                // 如果是 Django，这里可以直接跳转，目前先注释掉方便你测试
                // window.location.href = "/recipes/";
            }, 2000);
        });
    },

    // === 6. 数据可视化 ===
    initAnalytics() {
        const freqCtx = document.getElementById('frequencyChart');
        const dietCtx = document.getElementById('dietChart');
        if (typeof Chart === 'undefined') return;

        if (freqCtx) {
            new Chart(freqCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{ label: 'Meals', data: [15, 22, 35, 20, 28, 42], backgroundColor: '#2d6a4f', borderRadius: 6 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        if (dietCtx) {
            new Chart(dietCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Protein', 'Veg', 'Quick', 'Other'],
                    datasets: [{ data: [36, 29, 19, 16], backgroundColor: ['#2d6a4f', '#198754', '#ffc107', '#6c757d'], borderWidth: 0 }]
                },
                options: { cutout: '75%', plugins: { legend: { position: 'right' } } }
            });
        }
    },

    // === 7. 辅助工具函数 ===
    toggleListItemState(checkbox, className) {
        const row = checkbox.closest('.list-group-item');
        const label = row.querySelector('.item-label') || row.querySelector('span');
        if (checkbox.checked) {
            row.classList.add(className);
            label.classList.add('text-decoration-line-through', 'text-muted');
        } else {
            row.classList.remove(className);
            label.classList.remove('text-decoration-line-through', 'text-muted');
        }
    },

    updateShoppingStats() {
        const all = document.querySelectorAll('.item-checkbox');
        const checked = document.querySelectorAll('.item-checkbox:checked');
        const update = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
        update('statChecked', checked.length);
        update('statRemaining', all.length - checked.length);
        update('statTotal', all.length);
    },

    reorderSteps(container) {
        container.querySelectorAll('.step-number').forEach((el, idx) => el.innerText = idx + 1);
    },

    manageRemoveButtons(container) {
        const rows = container.querySelectorAll('.remove-row-btn');
        rows.forEach(btn => btn.disabled = rows.length === 1);
    },

    showError(input, msg) {
        input.classList.add('is-invalid');
        const err = document.createElement('div');
        err.className = 'invalid-feedback custom-error d-block small mt-1';
        err.innerText = msg;
        input.parentNode.appendChild(err);
    },

    clearErrors() {
        document.querySelectorAll('.custom-error').forEach(el => el.remove());
    },

    async handleFormSubmit(form, loadingText, successMsg) {
        const btn = form.querySelector('button[type="submit"]');
        if (!btn) return;

        const oldText = btn.innerHTML;
        // 增加 Bootstrap Spinner 加载圈
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
        btn.disabled = true;

        // 模拟后端延迟
        await new Promise(r => setTimeout(r, this.CONFIG.MOCK_DELAY));

        // 弹出顶部 Toast 提示
        this.toast(successMsg);

        btn.innerHTML = oldText;
        btn.disabled = false;
    },

    // 顶部中心“掉落”式 Toast
    toast(msg) {
        const toast = document.createElement('div');
        toast.style = `
            position: fixed; top: -100px; left: 50%; transform: translateX(-50%);
            background: #2d6a4f; color: white; padding: 14px 28px;
            border-radius: 0 0 12px 12px; z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-weight: bold;
            transition: top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            white-space: nowrap;
        `;
        toast.innerText = msg;
        document.body.appendChild(toast);

        setTimeout(() => { toast.style.top = '0px'; }, 10);
        setTimeout(() => {
            toast.style.top = '-100px';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },

    initMealPlanner() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-meal')) {
                const card = e.target.closest('.meal-card');
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 200);
            }
        });
    }
};