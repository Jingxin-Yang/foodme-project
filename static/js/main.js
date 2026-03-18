/**
 * FoodMe - Main JavaScript
 */

// Global: Toggle edit forms
window.toggleItemEdit = function(itemId) {
    const editForm = document.querySelector(".item-edit-" + itemId);
    if (editForm) editForm.classList.toggle("fm-edit-hidden");
};

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Login/Signup Logic ---
    const signupForm = document.getElementById('signupForm');
    const signupPassword = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (signupPassword) {
        signupPassword.addEventListener('input', function() {
            const val = this.value;
            this.className = (val.length >= 8 && /\d/.test(val)) ? 'form-control is-valid' : 'form-control is-invalid';
        });
        if (confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                this.className = (this.value === signupPassword.value && this.value !== '') ? 'form-control is-valid' : 'form-control is-invalid';
            });
        }
    }

    // --- 2. Password Visibility Toggle ---
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            input.type = input.type === 'password' ? 'text' : 'password';
            this.innerHTML = input.type === 'password' ? '🙈' : '👁️';
        });
    });

    // --- 3. Dynamic Rows (Add/Edit Recipe) ---
    document.addEventListener("click", function (e) {
        // Add step
        if (e.target && e.target.textContent.includes("+ ADD ANOTHER STEP")) {
            const container = document.getElementById('stepsContainer');
            if (!container) return;
            const allSteps = container.querySelectorAll(".d-flex.mb-3");
            const lastRow = allSteps[allSteps.length - 1];
            if (lastRow) {
                const newRow = lastRow.cloneNode(true);
                const badge = newRow.querySelector(".badge") || newRow.querySelector(".fm-step-badge");
                if (badge) badge.textContent = allSteps.length + 1;
                newRow.querySelector("textarea").value = "";
                container.appendChild(newRow);
            }
        }
        // Add ingredient
        if (e.target && e.target.textContent.includes("+ ADD INGREDIENT")) {
            const container = document.getElementById('ingredientsContainer');
            if (!container) return;
            const allRows = container.querySelectorAll(".row.g-2.mb-2");
            const lastRow = allRows[allRows.length - 1];
            if (lastRow) {
                const newRow = lastRow.cloneNode(true);
                newRow.querySelectorAll("input").forEach(i => i.value = "");
                newRow.querySelectorAll("select").forEach(s => s.selectedIndex = 0);
                container.appendChild(newRow);
            }
        }
        // Remove row
        if (e.target && e.target.textContent.trim() === "✕") {
            const row = e.target.closest(".d-flex.mb-3") || e.target.closest(".row.g-2.mb-2");
            const container = row.parentNode;
            if (container.children.length > 1) { row.remove(); }
        }
    });

    // --- 4. Recipe Detail Checklist ---
    const ingredientList = document.getElementById('recipeIngredientList');
    if (ingredientList) {
        ingredientList.querySelectorAll('.form-check-input').forEach(cb => {
            cb.addEventListener('change', function() {
                this.closest('.list-group-item').classList.toggle('fm-prepared-item', this.checked);
            });
        });
    }

    // --- 5. Analytics Chart ---
    const freqCanvas = document.getElementById('cookingFrequencyChart');
    const dataIsland = document.getElementById('chart-data');
    if (freqCanvas && dataIsland && typeof Chart !== 'undefined') {
        const rawData = JSON.parse(dataIsland.textContent);
        new Chart(freqCanvas, {
            type: 'bar',
            data: {
                labels: rawData.labels,
                datasets: [{ data: rawData.values, backgroundColor: '#2d6a4f', borderRadius: 6 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
            }
        });
    }

    // --- 6. Email Functionality ---
    const emailBtn = document.getElementById("emailListBtn");
    if (emailBtn) {
        emailBtn.addEventListener("click", function () {
            const items = document.querySelectorAll("#shoppingListGroup .list-group-item");
            let body = "My Shopping List:\n\n";
            items.forEach(item => {
                const name = item.querySelector(".fw-bold")?.textContent.trim();
                const qty = item.querySelector("small")?.textContent.trim();
                if (name) body += `- ${name} (${qty})\n`;
            });
            window.location.href = `mailto:?subject=FoodMe List&body=${encodeURIComponent(body)}`;
        });
    }

    // --- 7. Meal Planner Linking ---
    const daySel = document.getElementById("daySelector");
    const mealSel = document.getElementById("mealTypeSelector");
    function updateForms() {
        if (!daySel || !mealSel) return;
        document.querySelectorAll(".add-to-plan-form").forEach(form => {
            form.action = `/days/${daySel.value}/entries/`;
            const mInput = form.querySelector("input[name='meal_type']");
            if (mInput) mInput.value = mealSel.value;
        });
    }
    if (daySel) {
        daySel.addEventListener("change", updateForms);
        mealSel.addEventListener("change", updateForms);
        updateForms();
    }

    // --- 8. Fetch New Ingredient ---
    const saveIngBtn = document.getElementById("saveNewIngredient");
    if (saveIngBtn) {
        saveIngBtn.addEventListener("click", function () {
            const nameInput = document.getElementById("newIngredientName");
            if (!nameInput.value.trim()) return;
            fetch("/ingredients/add/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded", "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] },
                body: "name=" + encodeURIComponent(nameInput.value.trim())
            }).then(r => r.json()).then(data => {
                if (!data.error) {
                    document.querySelectorAll("select[name='ingredient_ids']").forEach(s => s.add(new Option(data.name, data.id, true, true)));
                    bootstrap.Modal.getInstance(document.getElementById("addIngredientModal")).hide();
                    nameInput.value = "";
                }
            });
        });
    }

    // --- 9. Profile Auto-switch Tab ---
    const securityTab = document.getElementById("security-tab");
    if (document.querySelector('.alert-danger') && securityTab) {
        bootstrap.Tab.getOrCreateInstance(securityTab).show();
    }

    // --- 10. Prevent Duplicate Ingredients on Submit ---
    const recipeForms = [document.getElementById('recipeForm'), document.getElementById('editRecipeForm')];

    recipeForms.forEach(form => {
        if (form) {
            form.addEventListener('submit', function(e) {
                const selects = form.querySelectorAll("select[name='ingredient_ids']");
                const seen = new Set();
                let hasDuplicate = false;

                selects.forEach(select => {
                    // Ensure select has a valid value
                    if (select.value && seen.has(select.value)) {
                        hasDuplicate = true;
                    }
                    if (select.value) {
                        seen.add(select.value);
                    }
                });

                if (hasDuplicate) {
                    // Prevent submission and warn user
                    e.preventDefault();
                    alert("⚠️ You have selected duplicate ingredients. Please combine or remove them before saving.");
                }
            });
        }
    });

    // --- 11. Shopping List AJAX Update ---
    const shoppingListGroup = document.getElementById('shoppingListGroup');
    if (shoppingListGroup) {
        shoppingListGroup.addEventListener('change', function(e) {
            if (e.target.classList.contains('purchase-checkbox')) {
                const checkbox = e.target;

                // Get target URL from dataset
                const targetUrl = checkbox.dataset.url;

                const listItem = checkbox.closest('.list-group-item');
                const label = listItem.querySelector('.form-check-label');
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

                // Update UI immediately
                listItem.classList.toggle('bg-light', checkbox.checked);
                label.classList.toggle('text-decoration-line-through', checkbox.checked);
                label.classList.toggle('text-muted', checkbox.checked);

                // Update counts
                const checkedOffEl = document.getElementById('checkedOffCount');
                const remainingEl = document.getElementById('remainingCount');
                if (checkedOffEl && remainingEl) {
                    let c = parseInt(checkedOffEl.textContent) || 0;
                    let r = parseInt(remainingEl.textContent) || 0;
                    checkbox.checked ? (c++, r--) : (c--, r++);
                    checkedOffEl.textContent = c;
                    remainingEl.textContent = r;
                }

                // Send request using targetUrl
                fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }).then(response => {
                    if (!response.ok) {
                        alert("Sync failed. Check console for 404 error.");
                    }
                }).catch(err => console.error("Sync Error:", err));
            }
        });
    }

    // --- 12. Toggle Edit/Cancel Buttons ---
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toggle-edit-btn') || e.target.classList.contains('cancel-edit-btn')) {
            const itemId = e.target.dataset.itemId;
            const editContainer = document.querySelector(`.item-edit-container-${itemId}`);
            if (editContainer) {
                editContainer.classList.toggle('fm-edit-hidden');
            }
        }
    });

    // --- 13. Delete Confirmation ---
    document.querySelectorAll('.delete-item-form, .delete-list-form, .delete-recipe-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!confirm('Are you sure you want to delete this?')) {
                e.preventDefault();
            }
        });
    });

    // --- 14. Meal Planner AJAX ---
    const addMealForms = document.querySelectorAll('.add-to-plan-form');
    if (addMealForms.length > 0) {
        addMealForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                const daySelector = document.getElementById('daySelector');
                // Get full URL from selected option
                const selectedOption = daySelector.options[daySelector.selectedIndex];
                const url = selectedOption.getAttribute('data-url');

                if (!url) {
                    alert("Error: URL not found on day selector.");
                    return;
                }

                const mealType = document.getElementById('mealTypeSelector').value;
                const recipeId = this.querySelector('[name="recipe_id"]').value;
                const csrfToken = this.querySelector('[name="csrfmiddlewaretoken"]').value;

                const formData = new FormData();
                formData.append('recipe_id', recipeId);
                formData.append('meal_type', mealType);
                formData.append('csrfmiddlewaretoken', csrfToken);

                fetch(url, {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                })
                .then(response => {
                    if (!response.ok) throw new Error('404 or Server Error');
                    return response.json();
                })
                .then(data => {
                    if (data.status === 'success') {
                        const targetCell = document.getElementById(`cell-${data.day_id}-${data.meal_type}`);
                        if (targetCell) {
                            const entryDiv = document.createElement('div');
                            entryDiv.className = 'fm-meal-entry text-start position-relative animate__animated animate__fadeIn';
                            entryDiv.innerHTML = `<small class="fw-bold d-block text-dark">${data.recipe_title}</small><small class="text-success" style="font-size: 0.7rem;">Added!</small>`;
                            targetCell.appendChild(entryDiv);
                        }
                    }
                })
                .catch(err => {
                    console.error("Fetch error:", err);
                    alert("Sync failed. Check if the URL is correct.");
                });
            });
        });
    }

    // --- 15. Handle Meal Plan Week Selector ---
    const planSelector = document.getElementById("planSelector");
    if (planSelector) {
        planSelector.addEventListener("change", function() {
            window.location.href = `/mealplans/${this.value}/`;
        });
    }

});