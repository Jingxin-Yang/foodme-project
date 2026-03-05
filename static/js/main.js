// 确保网页的 HTML 结构全都加载完了再执行 JS
document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // 1~3. 登录与注册表单验证逻辑 (保持原样)
    // ==========================================
    const signupForm = document.querySelector('#signupSection form');
    const signupPassword = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (signupForm) {
        signupPassword.addEventListener('input', function() {
            const val = this.value;
            if (val.length === 0) {
                this.className = 'form-control';
            } else if (val.length < 8 || !/\d/.test(val)) {
                this.className = 'form-control is-invalid';
            } else {
                this.className = 'form-control is-valid';
            }
        });

        confirmPassword.addEventListener('input', function() {
            if (this.value === '') {
                this.className = 'form-control';
            } else if (this.value !== signupPassword.value) {
                this.className = 'form-control is-invalid';
            } else {
                this.className = 'form-control is-valid';
            }
        });

        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            document.querySelectorAll('.custom-error').forEach(el => el.remove());

            let isValid = true;
            const emailInput = document.getElementById('signupEmail');
            const nameInput = document.getElementById('signupName');

            if (!nameInput.value.trim()) {
                showError(nameInput, 'Please enter your full name.');
                isValid = false;
            }

            if (!signupPassword.classList.contains('is-valid')) {
                showError(signupPassword, 'Password must be at least 8 characters and contain a number.');
                isValid = false;
            }

            if (signupPassword.value !== confirmPassword.value) {
                showError(confirmPassword, 'Passwords do not match.');
                isValid = false;
            }

            if (isValid) {
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = 'CREATING ACCOUNT...';
                submitBtn.disabled = true;

                setTimeout(() => {
                    alert('前端测试成功！数据校验完美。等后端接口写好，这里替换成真实的 fetch 请求即可。');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 1500);
            }
        });
    }

    function showError(inputElement, message) {
        inputElement.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback custom-error d-block small mt-1';
        errorDiv.innerText = message;
        inputElement.parentNode.appendChild(errorDiv);
    }

    // ==========================================
    // 4. 密码可见性切换 (小眼睛功能)
    // ==========================================
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = '👁️';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = '🙈';
            }
        });
    });

    // ==========================================
    // 5. 购物清单：动态勾选、灰底变色、统计数字与假 Edit 弹窗
    // ==========================================
    const shoppingList = document.getElementById('shoppingListGroup');
    if (shoppingList) {

        // 核心函数 1：每次变动时，扫描所有复选框，更新背景颜色和划线
        function updateItemAppearance() {
            const checkboxes = document.querySelectorAll('.item-checkbox');
            checkboxes.forEach(checkbox => {
                const listItem = checkbox.closest('.list-group-item');
                const label = listItem.querySelector('.item-label');

                if (checkbox.checked) {
                    // 使用刚写的专属类名 item-completed，实现明显置灰和半透明！
                    listItem.classList.add('item-completed');
                    label.classList.add('text-decoration-line-through', 'text-muted');
                } else {
                    listItem.classList.remove('item-completed');
                    label.classList.remove('text-decoration-line-through', 'text-muted');
                }
            });
        }

        // 核心函数 2：每次变动时，计算打勾数量，更新顶部四个大卡片
        function updateShoppingStats() {
            const checkboxes = document.querySelectorAll('.item-checkbox');
            const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');

            const totalItems = checkboxes.length;
            const checkedItems = checkedBoxes.length;
            const remainingItems = totalItems - checkedItems;

            const statChecked = document.getElementById('statChecked');
            const statRemaining = document.getElementById('statRemaining');
            const statTotal = document.getElementById('statTotal');

            if (statChecked) statChecked.innerText = checkedItems;
            if (statRemaining) statRemaining.innerText = remainingItems;
            if (statTotal) statTotal.innerText = totalItems;
        }

        // 页面刚加载完时，立刻执行一次，让 HTML 里默认打勾的物品直接变灰！
        updateItemAppearance();
        updateShoppingStats();

        // 监听整个列表里的点击动作
        shoppingList.addEventListener('change', function(e) {
            // 如果用户点击了打勾框，立刻更新颜色和算数
            if (e.target.classList.contains('item-checkbox')) {
                updateItemAppearance();
                updateShoppingStats();
            }
        });

        // 监听点击 Edit 按钮的动作，假装能修改名字
        shoppingList.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const labelElement = e.target.closest('.list-group-item').querySelector('.item-label');
                const currentName = labelElement.innerText;

                // 弹出一个系统输入框让用户改名字
                const newName = prompt("Edit item name:", currentName);

                // 如果用户输入了新名字并且点了确定，立刻修改页面文字
                if (newName !== null && newName.trim() !== "") {
                    labelElement.innerText = newName.trim();
                }
            }
        });
    }

    // ==========================================
    // 6. Meal Planner：模拟删除与添加交互
    // ==========================================
    // 监听表格中所有的 Remove 点击
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-meal')) {
            // 找到包裹这个文字的整个卡片框，然后让它消失！
            const cardToHide = e.target.closest('.meal-card');
            cardToHide.style.opacity = '0';
            setTimeout(() => {
                cardToHide.remove();
            }, 200); // 0.2秒后从HTML里彻底拔除
        }
    });

    // 监听底部 + Add to Plan 按钮
    const addPlanBtns = document.querySelectorAll('.add-to-plan-btn');
    addPlanBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 把按钮文字变成已添加
            this.innerText = '✓ Added';
            this.classList.remove('btn-outline-primary');
            this.classList.add('btn-success', 'text-white');
            // 提醒用户（这也就是假装的后端交互）
            alert("在真实的系统中，这会弹出一个窗口让你选择添加到星期几的哪一餐。");
        });
    });

    // ==========================================
    // 7. Add Recipe：动态增加配料和步骤
    // ==========================================
    const addRecipeForm = document.getElementById('addRecipeForm');

    if (addRecipeForm) {

        const ingredientsContainer = document.getElementById('ingredientsContainer');
        const addIngredientBtn = document.getElementById('addIngredientBtn');

        const stepsContainer = document.getElementById('stepsContainer');
        const addStepBtn = document.getElementById('addStepBtn');

        // --- 1. 动态添加配料行 ---
        addIngredientBtn.addEventListener('click', function() {
            const newRow = document.createElement('div');
            newRow.className = 'd-flex gap-2 mb-2 ingredient-row transition-all';
            // 填入 HTML 结构，注意这次的删除按钮没有 disabled
            newRow.innerHTML = `
                <input type="text" class="form-control bg-light border-0 w-25" placeholder="Amount">
                <input type="text" class="form-control bg-light border-0 w-25" placeholder="Unit">
                <input type="text" class="form-control bg-light border-0 w-50" placeholder="Ingredient">
                <button type="button" class="btn btn-outline-danger border-0 remove-row-btn" title="Remove">✕</button>
            `;
            ingredientsContainer.appendChild(newRow);
            updateRemoveButtons(ingredientsContainer); // 检查是否需要解锁删除按钮
        });

        // --- 2. 动态添加步骤行 ---
        addStepBtn.addEventListener('click', function() {
            const stepCount = stepsContainer.children.length + 1; // 计算当前是第几步
            const newRow = document.createElement('div');
            newRow.className = 'd-flex gap-3 mb-3 step-row transition-all align-items-start';
            newRow.innerHTML = `
                <div class="step-number bg-dark text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style="width: 32px; height: 32px; font-weight: bold;">${stepCount}</div>
                <textarea class="form-control bg-light border-0 flex-grow-1" rows="2" placeholder="Describe this step..."></textarea>
                <button type="button" class="btn btn-outline-danger border-0 remove-row-btn mt-1" title="Remove">✕</button>
            `;
            stepsContainer.appendChild(newRow);
            updateRemoveButtons(stepsContainer);
        });

        // --- 3. 监听所有的删除按钮 (事件委托机制) ---
        // 我们把监听器绑在整个表单上，这样新生成的按钮也能被监听到
        addRecipeForm.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-row-btn')) {
                const container = e.target.closest('div[id$="Container"]'); // 找到是配料区还是步骤区
                const rowToDrop = e.target.closest('.d-flex');

                rowToDrop.style.opacity = '0'; // 先变透明
                setTimeout(() => {
                    rowToDrop.remove(); // 0.2秒后删除
                    // 如果删除了步骤，需要重新排一下序号
                    if (container.id === 'stepsContainer') {
                        recalculateStepNumbers();
                    }
                    updateRemoveButtons(container); // 检查是否只剩最后一行
                }, 200);
            }
        });

        // --- 辅助函数：重新计算步骤序号 ---
        function recalculateStepNumbers() {
            const stepRows = stepsContainer.querySelectorAll('.step-row');
            stepRows.forEach((row, index) => {
                row.querySelector('.step-number').innerText = index + 1;
            });
        }

        // --- 辅助函数：如果只剩一行，就禁用删除按钮 (防止全删光了) ---
        function updateRemoveButtons(container) {
            const rows = container.children;
            const firstRemoveBtn = rows[0].querySelector('.remove-row-btn');

            if (rows.length === 1) {
                firstRemoveBtn.disabled = true; // 仅剩一行，不让删
            } else {
                firstRemoveBtn.disabled = false; // 多于一行，第一行也能删
            }
        }

        // --- 拦截表单提交，假装保存 ---
        addRecipeForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 阻止默认刷新
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = 'SAVING...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert('前端测试成功！菜谱数据结构完美，等待后端接入。');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                // 模拟保存成功后跳回菜谱库
                window.location.href = "{% url 'recipes' %}";
            }, 1000);
        });
    }

    // ==========================================
    // 8. Recipe Detail：加入购物清单与勾选交互 (优化高亮版)
    // ==========================================
    const addToListBtn = document.getElementById('addToListBtn');
    const recipeIngredients = document.getElementById('recipeIngredients');

    if (addToListBtn && recipeIngredients) {

        // 1. 点击“Add to List”按钮的智能逻辑
        addToListBtn.addEventListener('click', function() {
            const checkboxes = recipeIngredients.querySelectorAll('.detail-checkbox');

            // 第一步：先数一数，用户自己手动勾选了几个？
            let checkedCount = 0;
            checkboxes.forEach(box => {
                if (box.checked) checkedCount++;
            });

            // 第二步：智能判断
            if (checkedCount === 0) {
                // 如果用户一个都没勾，默认他想“全选”整道菜的配料
                checkboxes.forEach(box => {
                    box.checked = true;
                    box.closest('.list-group-item').classList.add('item-selected');
                });
                checkedCount = checkboxes.length; // 数量变成全选的总数
            } else {
                // 如果用户已经勾选了特定的几个，就保持原样，什么都不用强行改变
            }

            // 第三步：改变按钮的外观，并且精准告诉用户加了多少个！
            this.innerText = `✓ ADDED ${checkedCount} ITEMS`;
            this.classList.remove('btn-outline-secondary');
            this.classList.add('btn-success', 'text-white');

            // 弹出提示
            setTimeout(() => {
                alert(`前端模拟：成功将 ${checkedCount} 项食材加入您的购物清单！`);
            }, 300);
        });

        // 2. 监听单个配料的点击行为（也能独立高亮）
        recipeIngredients.addEventListener('change', function(e) {
            if (e.target.classList.contains('detail-checkbox')) {
                const box = e.target;
                const listItem = box.closest('.list-group-item');

                // 选中就高亮，取消就恢复白底
                if (box.checked) {
                    listItem.classList.add('item-selected');
                } else {
                    listItem.classList.remove('item-selected');
                }
            }
        });
    }

    // ==========================================
    // 9. Analytics: Chart.js 动态数据可视化图表
    // ==========================================
    // 渲染左侧的柱状图 (Cooking Frequency)
    const frequencyCtx = document.getElementById('frequencyChart');
    if (frequencyCtx) {
        new Chart(frequencyCtx, {
            type: 'bar', // 图表类型：柱状图
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // X轴标签
                datasets: [{
                    label: 'Meals Cooked',
                    // 这些假数据，以后组员只需要在后端填入真实数组替换即可！
                    data: [15, 22, 35, 20, 28, 42],
                    backgroundColor: '#2d6a4f', // 咱们的罗勒绿主色调
                    borderRadius: 6, // 圆角柱子，比直角更现代
                    barPercentage: 0.6 // 让柱子稍微细一点，看着更精致
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false } // 隐藏多余的图例
                },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5] } }, // 把Y轴网格变成高级的虚线
                    x: { grid: { display: false } } // 隐藏X轴的网格线，保持页面干净
                }
            }
        });
    }

    // 渲染底部的环形图/甜甜圈图 (Dietary Distribution)
    const dietCtx = document.getElementById('dietChart');
    if (dietCtx) {
        new Chart(dietCtx, {
            type: 'doughnut', // 图表类型：甜甜圈
            data: {
                labels: ['High-Protein', 'Vegetarian', 'Quick', 'Keto', 'Others'],
                datasets: [{
                    data: [36, 29, 19, 10, 6],
                    backgroundColor: [
                        '#2d6a4f', // 罗勒绿
                        '#198754', // 成功绿
                        '#ffc107', // 警告黄
                        '#dc3545', // 危险红
                        '#6c757d'  // 灰色
                    ],
                    borderWidth: 0, // 去掉图表自带的白边
                    hoverOffset: 10 // 鼠标悬停时，那一块会凸出来！
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%', // 中间挖空变大，这叫“逼格”
                plugins: {
                    legend: {
                        position: 'right', // 图例放在右边
                        labels: { padding: 20, usePointStyle: true } // 图例变成小圆点而不是方块
                    }
                }
            }
        });
    }

});