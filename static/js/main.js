//确保网页的 HTML 结构全都加载完了再执行 JS
document.addEventListener('DOMContentLoaded', function() {

    //获取注册表单和输入框
    const signupForm = document.querySelector('#signupSection form');
    const signupPassword = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    //如果当前页面有注册表单，才执行后续逻辑
    if (signupForm) {

        //1. 密码强度实时检测 (Password strength indicator)
        signupPassword.addEventListener('input', function() {
            const val = this.value;
            //简单的强度判断逻辑：长度大于8，且包含数字
            if (val.length === 0) {
                this.className = 'form-control'; //恢复原样
            } else if (val.length < 8 || !/\d/.test(val)) {
                this.className = 'form-control is-invalid'; //Bootstrap的红框报错样式
            } else {
                this.className = 'form-control is-valid'; //Bootstrap的绿框通过样式
            }
        });

        //2. 两次密码一致性实时检测
        confirmPassword.addEventListener('input', function() {
            if (this.value === '') {
                this.className = 'form-control';
            } else if (this.value !== signupPassword.value) {
                this.className = 'form-control is-invalid';
            } else {
                this.className = 'form-control is-valid';
            }
        });

        //3. 表单提交前的最终验证 — 通过后提交给 Django 后端
        signupForm.addEventListener('submit', function(e) {
            //清除之前的旧错误提示
            document.querySelectorAll('.custom-error').forEach(el => el.remove());

            let isValid = true;
            const nameInput = document.getElementById('signupName');

            //检查姓名是否为空
            if (!nameInput.value.trim()) {
                showError(nameInput, 'Please enter your full name.');
                isValid = false;
            }

            //检查密码是否通过
            if (!signupPassword.classList.contains('is-valid')) {
                showError(signupPassword, 'Password must be at least 8 characters and contain a number.');
                isValid = false;
            }

            //检查两次密码是否一致
            if (signupPassword.value !== confirmPassword.value) {
                showError(confirmPassword, 'Passwords do not match.');
                isValid = false;
            }

            //if validation fails, stop submission — otherwise let Django handle it
            if (!isValid) {
                e.preventDefault();
            }
        });
    }

    //辅助函数：在输入框下方插入红色的错误提示文字 (Error messages display below invalid fields)
    function showError(inputElement, message) {
        inputElement.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback custom-error d-block small mt-1';
        errorDiv.innerText = message;
        inputElement.parentNode.appendChild(errorDiv);
    }

    //=== 密码可见性切换 (小眼睛功能) ===
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            //找到与这个按钮紧挨着的输入框
            const passwordInput = this.previousElementSibling;

            //切换输入框的类型
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = '👁️';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = '🙈';
            }
        });
    });

    //add ingredient button
    //clones  last ingredient row and clears it
    document.addEventListener("click", function (e) {
        if (e.target && e.target.textContent.trim() === "+ ADD ANOTHER STEP") {
            const card = e.target.closest(".card");
            const allSteps = card.querySelectorAll(".d-flex.mb-3");
            const lastStepRow = allSteps[allSteps.length - 1];

            if (!lastStepRow) return;

            const newStep = lastStepRow.cloneNode(true);
            //update step number badge
            const badge = newStep.querySelector(".badge");
            if (badge) badge.textContent = allSteps.length + 1;
            //clear the textarea
            const textarea = newStep.querySelector("textarea");
            if (textarea) textarea.value = "";
            lastStepRow.parentNode.insertBefore(newStep, e.target);
        }
    });

    //add ingredient button
    //clones  last ingredient row and clears it
    document.addEventListener("click", function (e) {
        if (e.target && e.target.textContent.trim() === "+ ADD INGREDIENT") {
            const card = e.target.closest(".card");
            const allRows = card.querySelectorAll(".row.g-2.mb-2");
            const lastRow = allRows[allRows.length - 1];

            if (!lastRow) return;

            const newRow = lastRow.cloneNode(true);
            //clear all 
            newRow.querySelectorAll("input").forEach(function (input) {
                input.value = "";
            });
            //reset 
            newRow.querySelectorAll("select").forEach(function (select) {
                select.selectedIndex = 0;
            });
            lastRow.parentNode.insertBefore(newRow, e.target);
        }
    });

    //emove step or ingredient row when x is clicked
    document.addEventListener("click", function (e) {
        if (e.target && e.target.textContent.trim() === "✕") {
            const row = e.target.closest(".d-flex.mb-3") || e.target.closest(".row.g-2.mb-2");
            if (row) row.remove();
        }
    });

    //meal planner wire day and meal type selectors to add to plan forms
    const daySelector = document.getElementById("daySelector");
    const mealTypeSelector = document.getElementById("mealTypeSelector");

    function updatePlanForms() {
        if (!daySelector || !mealTypeSelector) return;
        const dayId = daySelector.value;
        const mealType = mealTypeSelector.value;
        //update every add to plan form on the page
        document.querySelectorAll(".add-to-plan-form").forEach(function(form) {
            //update the form action to post to the correct day
            form.action = "/days/" + dayId + "/entries/";
            //update the hidden meal_type input
            const mealTypeInput = form.querySelector("input[name='meal_type']");
            if (mealTypeInput) mealTypeInput.value = mealType;
        });
    }

    if (daySelector) daySelector.addEventListener("change", updatePlanForms);
    if (mealTypeSelector) mealTypeSelector.addEventListener("change", updatePlanForms);
    //run once on page load to set initial values
    updatePlanForms();

    //new ingredient modal posts to backend and adds to all dropdowns
    const saveNewIngredient = document.getElementById("saveNewIngredient");
    if (saveNewIngredient) {
        saveNewIngredient.addEventListener("click", function () {
            const name = document.getElementById("newIngredientName").value.trim();
            const errorEl = document.getElementById("ingredientModalError");

            if (!name) {
                errorEl.textContent = "please enter an ingredient name";
                errorEl.style.display = "block";
                return;
            }

            //post to backend to create the ingredient
            fetch("/ingredients/add/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "name=" + encodeURIComponent(name) + "&csrfmiddlewaretoken=" + document.cookie.match(/csrftoken=([^;]+)/)[1]
            })
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    errorEl.textContent = data.error;
                    errorEl.style.display = "block";
                    return;
                }
                //add the new ingredient to every ingredient dropdown on the page
                document.querySelectorAll("select[name='ingredient_ids']").forEach(function (select) {
                    const option = document.createElement("option");
                    option.value = data.id;
                    option.textContent = data.name;
                    option.selected = true;
                    select.appendChild(option);
                });
                //close modal and reset
                document.getElementById("newIngredientName").value = "";
                errorEl.style.display = "none";
                bootstrap.Modal.getInstance(document.getElementById("addIngredientModal")).hide();
            });
        });
    }

});
