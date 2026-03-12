// ==========================================================================
//  FoodMe - main.js
//  All front-end interaction logic for every page.
//  Each section is separated by a large heading comment for easy navigation.
// ==========================================================================

// Wait for the full HTML document to load before running any JS
document.addEventListener('DOMContentLoaded', function() {

    // ======================================================================
    //  Shared Utility Functions
    // ======================================================================

    /**
     * Show a red error message below an input field
     * @param {HTMLElement} inputEl - the input element
     * @param {string} message - the error text to display
     */
    function showError(inputEl, message) {
        inputEl.classList.add('is-invalid');
        // 查找紧邻的 invalid-feedback 元素并显示
        const feedback = inputEl.closest('.mb-3, .mb-4')?.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = 'block';
        }
    }

    /** Clear error styling from an input field */
    function clearError(inputEl) {
        inputEl.classList.remove('is-invalid');
        inputEl.classList.remove('is-valid');
    }

    /**
     * Announce a status message to screen readers (WCAG SC 4.1.3).
     * Visually hidden, but assistive devices will read it aloud.
     */
    function announce(message) {
        const announcer = document.getElementById('statusAnnouncer');
        if (announcer) {
            announcer.textContent = message;
            // Clear after brief delay so the next announcement is detected
            setTimeout(() => { announcer.textContent = ''; }, 3000);
        }
    }


    // ======================================================================
    //  1. Password Visibility Toggle (eye icon on all password fields)
    // ======================================================================
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';      // show password
                this.innerHTML = '👁️';
            } else {
                passwordInput.type = 'password';   // hide password
                this.innerHTML = '🙈';
            }
        });
    });


    // ======================================================================
    //  2. Login Page (login.html)
    // ======================================================================

    // --- Login form ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // prevent page refresh

            const email = document.getElementById('loginEmail');
            const password = document.getElementById('loginPassword');
            const errorBox = document.getElementById('loginError');
            let valid = true;

            // clear previous errors
            clearError(email);
            clearError(password);
            if (errorBox) errorBox.classList.add('d-none');

            // validate email format
            if (!email.value.trim() || !email.value.includes('@')) {
                email.classList.add('is-invalid');
                valid = false;
            }
            // validate password is not empty
            if (!password.value.trim()) {
                password.classList.add('is-invalid');
                valid = false;
            }

            if (valid) {
                // simulate successful login -> redirect to Dashboard
                const btn = loginForm.querySelector('button[type="submit"]');
                btn.innerHTML = 'LOGGING IN...';
                btn.disabled = true;
                setTimeout(() => {
                    // TODO: replace with real fetch('/login/', ...) once backend is connected
                    window.location.href = '/'; // redirect to Dashboard
                }, 1000);
            }
        });
    }

    // --- Signup form ---
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        const signupPassword = document.getElementById('signupPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        // Real-time password strength check: min 8 chars + at least one digit
        if (signupPassword) {
            signupPassword.addEventListener('input', function() {
                if (this.value.length === 0) {
                    this.className = 'form-control';
                } else if (this.value.length < 8 || !/\d/.test(this.value)) {
                    this.className = 'form-control is-invalid';
                } else {
                    this.className = 'form-control is-valid';
                }
            });
        }

        // Confirm-password match check
        if (confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                if (this.value === '') {
                    this.className = 'form-control';
                } else if (this.value !== signupPassword.value) {
                    this.className = 'form-control is-invalid';
                } else {
                    this.className = 'form-control is-valid';
                }
            });
        }

        // Signup form submission
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let valid = true;

            const name = document.getElementById('signupName');
            const email = document.getElementById('signupEmail');
            const terms = document.getElementById('termsAgree');
            const successBox = document.getElementById('signupSuccess');

            // validate name
            if (!name.value.trim()) {
                name.classList.add('is-invalid');
                valid = false;
            } else {
                name.classList.remove('is-invalid');
            }

            // validate email
            if (!email.value.trim() || !email.value.includes('@')) {
                email.classList.add('is-invalid');
                valid = false;
            } else {
                email.classList.remove('is-invalid');
            }

            // validate password strength
            if (!signupPassword.classList.contains('is-valid')) {
                signupPassword.classList.add('is-invalid');
                valid = false;
            }

            // validate password match
            if (signupPassword.value !== confirmPassword.value) {
                confirmPassword.classList.add('is-invalid');
                valid = false;
            }

            // validate terms agreement
            if (!terms.checked) {
                terms.classList.add('is-invalid');
                valid = false;
            } else {
                terms.classList.remove('is-invalid');
            }

            if (valid) {
                const btn = signupForm.querySelector('button[type="submit"]');
                btn.innerHTML = 'CREATING ACCOUNT...';
                btn.disabled = true;

                // show success message
                if (successBox) successBox.classList.remove('d-none');

                setTimeout(() => {
                    window.location.href = '/'; // redirect to Dashboard
                }, 1500);
            }
        });
    }


    // ======================================================================
    //  3. Recipes Page (recipes.html) - Search + Tag Filtering
    // ======================================================================

    const recipeGrid = document.getElementById('recipeGrid');
    const tagFilterGroup = document.getElementById('tagFilterGroup');
    const recipeSearchInput = document.getElementById('recipeSearchInput');
    const noRecipeResults = document.getElementById('noRecipeResults');

    if (recipeGrid && tagFilterGroup) {
        let activeTag = 'all'; // currently active tag filter

        /**
         * Filter and show/hide recipe cards.
         * Applies both the active tag filter and search keyword simultaneously.
         */
        function filterRecipes() {
            const searchText = recipeSearchInput ? recipeSearchInput.value.toLowerCase().trim() : '';
            const cards = recipeGrid.querySelectorAll('.recipe-card');
            let visibleCount = 0;

            cards.forEach(card => {
                const tags = card.dataset.tags || '';        // e.g. "high-protein,quick"
                const title = card.dataset.title || '';      // e.g. "Spicy Thai Basil Chicken"

                // check tag match
                const tagMatch = (activeTag === 'all') || tags.includes(activeTag);
                // check search keyword match
                const searchMatch = (searchText === '') || title.toLowerCase().includes(searchText);

                if (tagMatch && searchMatch) {
                    card.style.display = '';  // show
                    visibleCount++;
                } else {
                    card.style.display = 'none'; // hide
                }
            });

            // show "no results" message if nothing matched
            if (noRecipeResults) {
                noRecipeResults.classList.toggle('d-none', visibleCount > 0);
            }
        }

        // Tag button click handler
        tagFilterGroup.querySelectorAll('.tag-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // 1. reset all buttons to outline style
                tagFilterGroup.querySelectorAll('.tag-filter-btn').forEach(b => {
                    b.classList.remove('btn-dark');
                    b.classList.add('btn-outline-secondary');
                });
                // 2. highlight the clicked button
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-dark');
                // 3. update active tag and re-filter
                activeTag = this.dataset.tag;
                filterRecipes();
            });
        });

        // Search input: filter in real time as user types
        if (recipeSearchInput) {
            recipeSearchInput.addEventListener('input', filterRecipes);
        }
    }


    // ======================================================================
    //  4. Shopping List Page (shopping_list.html)
    // ======================================================================

    const shoppingList = document.getElementById('shoppingListGroup');

    if (shoppingList) {

        /** Update the four stat cards at the top (Total / Checked / Remaining / From Recipes) */
        function updateShoppingStats() {
            const allItems = shoppingList.querySelectorAll('.shopping-item');
            const checkedItems = shoppingList.querySelectorAll('.item-checkbox:checked');
            const recipeItems = shoppingList.querySelectorAll('.shopping-item[data-from="recipe"]');

            const total = allItems.length;
            const checked = checkedItems.length;
            const remaining = total - checked;

            document.getElementById('statTotal').textContent = total;
            document.getElementById('statChecked').textContent = checked;
            document.getElementById('statRemaining').textContent = remaining;
            document.getElementById('statRecipes').textContent = recipeItems.length;

            // announce to screen readers
            announce(checked + ' of ' + total + ' items checked off.');
        }

        /** Bind change events to every shopping-item checkbox */
        function bindCheckboxEvents() {
            shoppingList.querySelectorAll('.item-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    const li = this.closest('.shopping-item');
                    const label = li.querySelector('.form-check-label');

                    if (this.checked) {
                        // checked -> add strikethrough + grey background
                        li.classList.add('bg-light');
                        label.classList.add('text-decoration-line-through', 'text-muted');
                        label.classList.remove('text-dark');
                    } else {
                        // unchecked -> remove strikethrough
                        li.classList.remove('bg-light');
                        label.classList.remove('text-decoration-line-through', 'text-muted');
                        label.querySelector('.item-name')?.classList.add('text-dark');
                    }
                    updateShoppingStats();
                });
            });
        }

        /** Bind click events to every delete (✕) button */
        function bindDeleteEvents() {
            shoppingList.querySelectorAll('.delete-item-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const li = this.closest('.shopping-item');
                    const name = li.querySelector('.item-name')?.textContent || 'Item';
                    li.remove();
                    updateShoppingStats();
                    announce(name + ' removed from shopping list.');
                });
            });
        }

        // initialise event bindings and stats
        bindCheckboxEvents();
        bindDeleteEvents();
        updateShoppingStats();

        // --- Custom item form validation (User Story M4: prevent negative quantities) ---
        const customItemForm = document.getElementById('customItemForm');
        if (customItemForm) {
            customItemForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const nameInput = document.getElementById('itemName');
                const amountInput = document.getElementById('itemAmount');
                const unitSelect = document.getElementById('itemUnit');
                const amountError = document.getElementById('amountErrorText');
                let valid = true;

                // clear previous errors
                clearError(nameInput);
                clearError(amountInput);

                // validate name is not empty
                if (!nameInput.value.trim()) {
                    nameInput.classList.add('is-invalid');
                    valid = false;
                }

                // validate quantity: not empty, not negative, not zero
                const amount = parseFloat(amountInput.value);
                if (isNaN(amount) || amountInput.value.trim() === '') {
                    amountInput.classList.add('is-invalid');
                    amountError.textContent = 'Please enter a valid quantity.';
                    valid = false;
                } else if (amount < 0) {
                    // satisfies M4: prevent negative numbers
                    amountInput.classList.add('is-invalid');
                    amountError.textContent = 'Quantity cannot be negative.';
                    valid = false;
                } else if (amount === 0) {
                    amountInput.classList.add('is-invalid');
                    amountError.textContent = 'Quantity must be greater than 0.';
                    valid = false;
                }

                if (valid) {
                    // create a new list item and append it to the shopping list
                    const unit = unitSelect ? unitSelect.value : '';
                    const newLi = document.createElement('li');
                    newLi.className = 'list-group-item d-flex justify-content-between align-items-center py-3 shopping-item';
                    newLi.dataset.from = 'custom';
                    newLi.innerHTML = `
                        <div class="form-check d-flex align-items-center mb-0">
                            <input class="form-check-input me-3 item-checkbox" type="checkbox" style="width: 1.2rem; height: 1.2rem;">
                            <label class="form-check-label">
                                <span class="fw-bold d-block text-dark item-name">${nameInput.value.trim()}</span>
                                <small class="text-muted item-amount">${amount} ${unit}</small>
                            </label>
                        </div>
                        <button class="btn btn-link text-danger text-decoration-none small p-0 delete-item-btn">✕</button>
                    `;
                    shoppingList.appendChild(newLi);

                    // bind events to the newly added elements
                    bindCheckboxEvents();
                    bindDeleteEvents();
                    updateShoppingStats();

                    // reset the form
                    customItemForm.reset();
                    announce(nameInput.value.trim() + ' added to shopping list.');
                }
            });
        }

        // --- "Add From Recipes" buttons ---
        document.querySelectorAll('.add-recipe-ingredients-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const ingredients = JSON.parse(this.dataset.ingredients || '[]');
                ingredients.forEach(ing => {
                    const newLi = document.createElement('li');
                    newLi.className = 'list-group-item d-flex justify-content-between align-items-center py-3 shopping-item';
                    newLi.dataset.from = 'recipe';
                    newLi.innerHTML = `
                        <div class="form-check d-flex align-items-center mb-0">
                            <input class="form-check-input me-3 item-checkbox" type="checkbox" style="width: 1.2rem; height: 1.2rem;">
                            <label class="form-check-label">
                                <span class="fw-bold d-block text-dark item-name">${ing.name}</span>
                                <small class="text-muted item-amount">${ing.amount}</small>
                            </label>
                        </div>
                        <button class="btn btn-link text-danger text-decoration-none small p-0 delete-item-btn">✕</button>
                    `;
                    shoppingList.appendChild(newLi);
                });
                bindCheckboxEvents();
                bindDeleteEvents();
                updateShoppingStats();
                announce(ingredients.length + ' ingredients added from recipe.');
            });
        });

        // --- CLEAR CHECKED ITEMS button ---
        const clearCheckedBtn = document.getElementById('clearCheckedBtn');
        if (clearCheckedBtn) {
            clearCheckedBtn.addEventListener('click', function() {
                const checkedItems = shoppingList.querySelectorAll('.item-checkbox:checked');
                const count = checkedItems.length;
                checkedItems.forEach(cb => {
                    cb.closest('.shopping-item').remove();
                });
                updateShoppingStats();
                announce(count + ' checked items cleared.');
            });
        }

        // --- RESET LIST button ---
        const resetListBtn = document.getElementById('resetListBtn');
        if (resetListBtn) {
            resetListBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to reset the entire shopping list?')) {
                    shoppingList.innerHTML = '';
                    updateShoppingStats();
                    announce('Shopping list has been reset.');
                }
            });
        }

        // --- PRINT button ---
        const printListBtn = document.getElementById('printListBtn');
        if (printListBtn) {
            printListBtn.addEventListener('click', function() {
                window.print(); // trigger the browser's native print dialog
            });
        }

        // --- EMAIL button (requires backend SMTP integration) ---
        const emailListBtn = document.getElementById('emailListBtn');
        if (emailListBtn) {
            emailListBtn.addEventListener('click', function() {
                alert('Email feature requires backend integration (Django SMTP). This will be available once the backend is connected.');
            });
        }
    }


    // ======================================================================
    //  5. Meal Planner Page (meal_planner.html)
    // ======================================================================

    const mealPlanTable = document.getElementById('mealPlanTable');

    if (mealPlanTable) {

        // --- Remove button: click to remove a recipe from its cell ---
        function bindRemoveButtons() {
            mealPlanTable.querySelectorAll('.remove-meal-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const mealItem = this.closest('.meal-item');
                    const name = mealItem.querySelector('.fw-bold')?.textContent || 'Recipe';
                    mealItem.remove();
                    announce(name + ' removed from meal plan.');
                });
            });
        }
        bindRemoveButtons();

        // --- Add to Plan buttons ---
        document.querySelectorAll('.add-to-plan-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const card = this.closest('.plan-recipe-option');
                const recipeName = card.dataset.name;
                const recipeTime = card.dataset.time;

                // get the user-selected day and meal slot
                const daySelect = document.getElementById('planDaySelect');
                const mealSlot = document.getElementById('planMealSlot');

                if (!daySelect.value || !mealSlot.value) {
                    alert('Please select both a day and a meal slot first.');
                    return;
                }

                // find the matching table cell
                const targetCell = mealPlanTable.querySelector(
                    `.meal-cell[data-day="${daySelect.value}"][data-meal="${mealSlot.value}"]`
                );

                if (targetCell) {
                    // if the cell already has content, confirm replacement
                    if (targetCell.querySelector('.meal-item')) {
                        if (!confirm('This slot already has a recipe. Replace it?')) return;
                        targetCell.querySelector('.meal-item').remove();
                    }

                    // create a new recipe card in the cell
                    const newItem = document.createElement('div');
                    newItem.className = 'border rounded p-2 text-start position-relative bg-white shadow-sm meal-item';
                    newItem.innerHTML = `
                        <small class="fw-bold d-block text-dark">${recipeName}</small>
                        <small class="text-muted d-block mb-1">${recipeTime} min</small>
                        <button class="btn btn-link text-danger text-decoration-none p-0 small remove-meal-btn" style="font-size: 0.8rem;">Remove</button>
                    `;
                    targetCell.appendChild(newItem);

                    // rebind Remove button events to include the new card
                    bindRemoveButtons();
                    announce(recipeName + ' added to ' + mealSlot.value + ' on ' + daySelect.value + '.');
                }
            });
        });

        // --- Week navigation buttons ---
        const weekTitle = document.getElementById('weekTitle');
        const weekSubtitle = document.getElementById('weekSubtitle');
        let currentWeekOffset = 0; // 0 = current week

        function updateWeekDisplay() {
            // calculate the displayed week dates
            const baseDate = new Date(2026, 1, 3); // Monday, 3 Feb 2026
            baseDate.setDate(baseDate.getDate() + (currentWeekOffset * 7));
            const endDate = new Date(baseDate);
            endDate.setDate(endDate.getDate() + 6);

            const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
            weekTitle.textContent = `WEEK OF ${months[baseDate.getMonth()]} ${baseDate.getDate()}-${endDate.getDate()}, ${baseDate.getFullYear()}`;
            weekSubtitle.textContent = currentWeekOffset === 0 ? 'Current Week' : (currentWeekOffset > 0 ? currentWeekOffset + ' week(s) ahead' : Math.abs(currentWeekOffset) + ' week(s) ago');

            // update the day-number in each column header
            const dayIds = ['mon','tue','wed','thu','fri','sat','sun'];
            dayIds.forEach((id, i) => {
                const el = document.getElementById('day-' + id);
                if (el) {
                    const d = new Date(baseDate);
                    d.setDate(d.getDate() + i);
                    el.textContent = d.getDate();
                }
            });
        }

        document.getElementById('weekPrev')?.addEventListener('click', () => {
            currentWeekOffset--;
            updateWeekDisplay();
        });
        document.getElementById('weekNext')?.addEventListener('click', () => {
            currentWeekOffset++;
            updateWeekDisplay();
        });

        // --- Generate Shopping List link announcement ---
        const generateListBtn = document.getElementById('generateListBtn');
        if (generateListBtn) {
            generateListBtn.addEventListener('click', function(e) {
                announce('Shopping list generated from meal plan.');
            });
        }
    }


    // ======================================================================
    //  6. Analytics Page (analytics.html) - Chart.js Charts
    // ======================================================================

    const cookingFreqCanvas = document.getElementById('cookingFrequencyChart');

    if (cookingFreqCanvas && typeof Chart !== 'undefined') {

        // --- Sample data for each time range ---
        // TODO: Replace with real data from Django views once backend is connected
        const analyticsData = {
            week: {
                label: 'Showing: This Week',
                meals: 8, uniqueRecipes: 5, streak: '12 days', avgPrep: '25 min',
                mealsTrend: '↑ 5%', recipesTrend: '↑ 2%', prepTrend: '↓ 3%',
                frequency: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], data: [2,1,2,0,1,1,1] },
                topRecipes: { labels: ['Grilled Salmon','Oatmeal Bowl','Veggie Stir Fry'], data: [3,2,2] },
                mealTypes: { labels: ['High-Protein','Vegetarian','Quick','Keto'], data: [3,2,2,1] },
                weekly: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], data: [2,1,2,0,1,1,1] }
            },
            month: {
                label: 'Showing: February 2026',
                meals: 42, uniqueRecipes: 18, streak: '12 days', avgPrep: '28 min',
                mealsTrend: '↑ 12%', recipesTrend: '↑ 6%', prepTrend: '↓ 8%',
                frequency: { labels: ['Week 1','Week 2','Week 3','Week 4'], data: [12,10,11,9] },
                topRecipes: { labels: ['Grilled Salmon','Chicken Alfredo','Veggie Stir Fry','Beef Tacos','Oatmeal Bowl'], data: [8,6,5,4,4] },
                mealTypes: { labels: ['High-Protein','Vegetarian','Quick','Keto','Carnivore','Vegan'], data: [15,12,8,4,2,1] },
                weekly: { labels: ['Week 1','Week 2','Week 3','Week 4'], data: [12,10,11,9] }
            },
            '3months': {
                label: 'Showing: Dec 2025 - Feb 2026',
                meals: 115, uniqueRecipes: 32, streak: '12 days', avgPrep: '30 min',
                mealsTrend: '↑ 18%', recipesTrend: '↑ 10%', prepTrend: '↓ 5%',
                frequency: { labels: ['Dec','Jan','Feb'], data: [35,38,42] },
                topRecipes: { labels: ['Grilled Salmon','Chicken Alfredo','Veggie Stir Fry','Beef Tacos','Oatmeal Bowl'], data: [22,18,15,12,10] },
                mealTypes: { labels: ['High-Protein','Vegetarian','Quick','Keto','Carnivore','Vegan'], data: [40,30,22,12,8,3] },
                weekly: { labels: ['Dec','Jan','Feb'], data: [35,38,42] }
            },
            year: {
                label: 'Showing: 2025',
                meals: 380, uniqueRecipes: 45, streak: '12 days', avgPrep: '32 min',
                mealsTrend: '↑ 25%', recipesTrend: '↑ 15%', prepTrend: '↓ 10%',
                frequency: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], data: [25,28,30,32,35,33,30,28,35,38,34,32] },
                topRecipes: { labels: ['Grilled Salmon','Chicken Alfredo','Veggie Stir Fry','Beef Tacos','Oatmeal Bowl'], data: [65,52,48,40,35] },
                mealTypes: { labels: ['High-Protein','Vegetarian','Quick','Keto','Carnivore','Vegan'], data: [130,95,72,42,28,13] },
                weekly: { labels: ['Q1','Q2','Q3','Q4'], data: [83,100,93,104] }
            },
            all: {
                label: 'Showing: All Time',
                meals: 520, uniqueRecipes: 58, streak: '12 days', avgPrep: '31 min',
                mealsTrend: '', recipesTrend: '', prepTrend: '',
                frequency: { labels: ['2024 H1','2024 H2','2025 H1','2025 H2','2026'], data: [60,80,170,168,42] },
                topRecipes: { labels: ['Grilled Salmon','Chicken Alfredo','Veggie Stir Fry','Beef Tacos','Oatmeal Bowl'], data: [85,72,60,55,48] },
                mealTypes: { labels: ['High-Protein','Vegetarian','Quick','Keto','Carnivore','Vegan'], data: [180,130,95,55,38,22] },
                weekly: { labels: ['2024 H1','2024 H2','2025 H1','2025 H2','2026'], data: [60,80,170,168,42] }
            }
        };

        // Theme colours (matching CSS custom properties)
        const primaryColor = '#2d6a4f';
        const primaryLight = 'rgba(45,106,79,0.2)';
        const chartColors = ['#2d6a4f','#40916c','#52b788','#74c69d','#95d5b2','#d8f3dc'];

        // --- Initialise four Chart.js charts ---
        let freqChart, topChart, typeChart, trendChart;

        function createCharts(range) {
            const d = analyticsData[range];

            // destroy previous chart instances if they exist
            if (freqChart) freqChart.destroy();
            if (topChart) topChart.destroy();
            if (typeChart) typeChart.destroy();
            if (trendChart) trendChart.destroy();

            // Chart 1: Cooking Frequency (vertical bar chart)
            freqChart = new Chart(document.getElementById('cookingFrequencyChart'), {
                type: 'bar',
                data: {
                    labels: d.frequency.labels,
                    datasets: [{
                        label: 'Meals',
                        data: d.frequency.data,
                        backgroundColor: d.frequency.data.map((v, i) => {
                            // highlight the maximum value with the primary colour
                            const max = Math.max(...d.frequency.data);
                            return v === max ? primaryColor : primaryLight;
                        }),
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // Chart 2: Most Cooked Recipes (horizontal bar chart)
            topChart = new Chart(document.getElementById('mostCookedChart'), {
                type: 'bar',
                data: {
                    labels: d.topRecipes.labels,
                    datasets: [{
                        label: 'Times cooked',
                        data: d.topRecipes.data,
                        backgroundColor: primaryColor,
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y', // horizontal bars
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                        y: { grid: { display: false } }
                    }
                }
            });

            // Chart 3: Meal Type Distribution (doughnut chart)
            typeChart = new Chart(document.getElementById('mealTypeChart'), {
                type: 'doughnut',
                data: {
                    labels: d.mealTypes.labels,
                    datasets: [{
                        data: d.mealTypes.data,
                        backgroundColor: chartColors.slice(0, d.mealTypes.data.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } }
                    }
                }
            });

            // Chart 4: Weekly Cooking Trend (line chart)
            trendChart = new Chart(document.getElementById('weeklyTrendChart'), {
                type: 'line',
                data: {
                    labels: d.weekly.labels,
                    datasets: [{
                        label: 'Meals',
                        data: d.weekly.data,
                        borderColor: primaryColor,
                        backgroundColor: primaryLight,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: primaryColor,
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        /** Update the stat cards to reflect the selected time range */
        function updateAnalyticsStats(range) {
            const d = analyticsData[range];
            document.getElementById('statMealsCooked').textContent = d.meals;
            document.getElementById('statUniqueRecipes').textContent = d.uniqueRecipes;
            document.getElementById('statStreak').textContent = d.streak;
            document.getElementById('statAvgPrep').textContent = d.avgPrep;
            document.getElementById('timeRangeLabel').textContent = d.label;

            // update trend labels
            const mealsTrend = document.getElementById('statMealsTrend');
            const recipesTrend = document.getElementById('statRecipesTrend');
            const prepTrend = document.getElementById('statPrepTrend');
            if (d.mealsTrend) {
                mealsTrend.innerHTML = d.mealsTrend + ' <span class="text-muted fw-normal">from previous period</span>';
            } else {
                mealsTrend.innerHTML = '<span class="text-muted fw-normal">All time data</span>';
            }
            if (d.recipesTrend) {
                recipesTrend.innerHTML = d.recipesTrend + ' <span class="text-muted fw-normal">from previous period</span>';
            } else {
                recipesTrend.innerHTML = '<span class="text-muted fw-normal">All time data</span>';
            }
            if (d.prepTrend) {
                prepTrend.innerHTML = d.prepTrend + ' <span class="text-muted fw-normal">from previous period</span>';
            } else {
                prepTrend.innerHTML = '<span class="text-muted fw-normal">All time data</span>';
            }
        }

        // default to "month" data on page load
        createCharts('month');
        updateAnalyticsStats('month');

        // --- Time-range button click handler ---
        const timeRangeGroup = document.getElementById('timeRangeGroup');
        if (timeRangeGroup) {
            timeRangeGroup.querySelectorAll('.time-range-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    // toggle button styles
                    timeRangeGroup.querySelectorAll('.time-range-btn').forEach(b => {
                        b.classList.remove('btn-dark');
                        b.classList.add('btn-outline-secondary');
                    });
                    this.classList.remove('btn-outline-secondary');
                    this.classList.add('btn-dark');

                    // recreate charts and update stats for the new range
                    const range = this.dataset.range;
                    createCharts(range);
                    updateAnalyticsStats(range);
                });
            });
        }
    }


    // ======================================================================
    //  7. Add Recipe Page (add_recipe.html) - Dynamic Steps & Ingredients
    // ======================================================================

    const recipeForm = document.getElementById('recipeForm');
    if (recipeForm) {

        // --- "Add Another Step" button ---
        const addStepBtns = recipeForm.querySelectorAll('button');
        addStepBtns.forEach(btn => {
            if (btn.textContent.includes('ADD ANOTHER STEP')) {
                btn.addEventListener('click', function() {
                    const stepsContainer = this.parentElement;
                    const existingSteps = stepsContainer.querySelectorAll('.d-flex.mb-3');
                    const stepNum = existingSteps.length + 1;

                    const newStep = document.createElement('div');
                    newStep.className = 'd-flex mb-3';
                    newStep.innerHTML = `
                        <div class="me-3 mt-1">
                            <span class="badge bg-dark rounded-circle p-2 px-3">${stepNum}</span>
                        </div>
                        <div class="flex-grow-1">
                            <textarea class="form-control" rows="2" placeholder="Describe this step..."></textarea>
                        </div>
                        <div class="ms-2 mt-1">
                            <button type="button" class="btn btn-sm btn-outline-danger border-0">✕</button>
                        </div>
                    `;
                    stepsContainer.insertBefore(newStep, this);

                    // bind the remove handler to the new step's delete button
                    newStep.querySelector('.btn-outline-danger').addEventListener('click', function() {
                        newStep.remove();
                    });
                });
            }

            if (btn.textContent.includes('ADD INGREDIENT')) {
                btn.addEventListener('click', function() {
                    const container = this.parentElement;
                    const newRow = document.createElement('div');
                    newRow.className = 'row g-2 mb-2';
                    newRow.innerHTML = `
                        <div class="col-4">
                            <input type="text" class="form-control form-control-sm" placeholder="Amt (e.g. 1 cup)">
                        </div>
                        <div class="col-7">
                            <input type="text" class="form-control form-control-sm" placeholder="Ingredient name">
                        </div>
                        <div class="col-1 text-end">
                            <button type="button" class="btn btn-sm text-danger p-0 mt-1">✕</button>
                        </div>
                    `;
                    container.insertBefore(newRow, this);

                    newRow.querySelector('.text-danger').addEventListener('click', function() {
                        newRow.remove();
                    });
                });
            }
        });

        // --- Delete (✕) buttons for existing steps/ingredients ---
        recipeForm.querySelectorAll('.btn-outline-danger, .text-danger').forEach(btn => {
            if (btn.textContent.trim() === '✕') {
                btn.addEventListener('click', function() {
                    const row = this.closest('.d-flex, .row');
                    if (row) row.remove();
                });
            }
        });

        // --- Save Recipe button ---
        recipeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const title = document.getElementById('recipeTitle');
            if (!title.value.trim()) {
                title.classList.add('is-invalid');
                return;
            }
            // simulate successful save
            alert('Recipe saved successfully! (Backend integration needed to persist data)');
            window.location.href = '/recipes/';
        });
    }


    // ======================================================================
    //  8. Recipe Detail Page (recipe_detail.html) - Favourite Toggle
    // ======================================================================

    // find the favourite button
    const favBtn = document.querySelector('.btn-outline-secondary.btn-sm.fw-bold');
    if (favBtn && favBtn.textContent.includes('FAVORITE')) {
        let isFavorited = false;
        favBtn.addEventListener('click', function() {
            isFavorited = !isFavorited;
            if (isFavorited) {
                this.innerHTML = '❤️ FAVORITED';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-danger');
            } else {
                this.innerHTML = '❤️ FAVORITE';
                this.classList.remove('btn-danger');
                this.classList.add('btn-outline-secondary');
            }
            announce(isFavorited ? 'Recipe added to favorites.' : 'Recipe removed from favorites.');
        });
    }

    // "ADD TO PLANNER" button
    const addToPlannerBtn = document.querySelector('.btn-primary.btn-sm.fw-bold');
    if (addToPlannerBtn && addToPlannerBtn.textContent.includes('ADD TO PLANNER')) {
        addToPlannerBtn.addEventListener('click', function() {
            window.location.href = '/planner/';
        });
    }

    // Ingredient checkboxes (check = "prepared")
    document.querySelectorAll('.list-group-item .form-check-input').forEach(cb => {
        // only applies on recipe_detail page (not shopping_list)
        if (!shoppingList && cb.closest('.list-group')) {
            cb.addEventListener('change', function() {
                const label = this.closest('.list-group-item').querySelector('span.text-muted, div');
                if (this.checked) {
                    this.closest('.list-group-item').style.opacity = '0.5';
                } else {
                    this.closest('.list-group-item').style.opacity = '1';
                }
            });
        }
    });

}); // end DOMContentLoaded
