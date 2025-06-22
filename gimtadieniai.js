document.addEventListener('DOMContentLoaded', function() {
    const characterCardsContainer = document.getElementById('character-cards');
    const monthGrid = document.getElementById('month-grid');
    const characterDetailView = document.getElementById('character-detail-view');
    const characterDetailContent = document.querySelector('.character-detail-content');
    const goBackButton = document.querySelector('.go-back-button');
    const characterSearch = document.getElementById('character-search');
    const searchResults = document.getElementById('search-results');
    const thisWeekBirthdays = document.querySelector('#this-week-birthdays .special-date-list');
    const thisMonthBirthdays = document.querySelector('#this-month-birthdays .special-date-list');

    let characters = [];
    let currentView = 'grid';

    // Lithuanian month names
    const lithuanianMonths = [
        'Sausis', 'Vasaris', 'Kovas', 'Balandis',
        'Gegužė', 'Birželis', 'Liepa', 'Rugpjūtis',
        'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'
    ];

    // Load character data
    fetch('https://raw.githubusercontent.com/nedoramoteris/voratinklis/refs/heads/main/avatarai.txt')
        .then(response => response.text())
        .then(data => {
            characters = parseCharacterData(data);
            renderCharacterCards();
            renderMonthGrid();
            updateSpecialDates();
        })
        .catch(error => {
            console.error('Error loading character data:', error);
            characters = [];
            renderCharacterCards();
            renderMonthGrid();
            updateSpecialDates();
        });

    // Parse character data with strict date validation
    function parseCharacterData(data) {
        const lines = data.split('\n');
        const result = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            // Handle tab-separated or multiple spaces
            const columns = line.split('\t').filter(col => col.trim() !== '');
            if (columns.length < 2) continue;
            
            const name = columns[0].trim();
            const image = columns[1].trim();
            const birthDateStr = columns.length > 3 ? columns[3].trim() : '';
            const deathDateStr = columns.length > 5 ? columns[5].trim() : '';
            
            // Only include if we have complete birth date (day, month, year)
            const birthDate = parseDate(birthDateStr);
            if (!birthDate || !birthDate.day || !birthDate.month || !birthDate.year) continue;
            
            const deathDate = parseDate(deathDateStr);
            
            result.push({
                name,
                image,
                birthDate,
                deathDate,
                birthDateStr,
                deathDateStr
            });
        }
        
        return result;
    }

    // Parse date with YYYY-MM-DD as primary format (Lithuanian standard)
    function parseDate(dateStr) {
        if (!dateStr || dateStr.toLowerCase() === 'none' || dateStr.toLowerCase() === 'unknown') {
            return null;
        }
        
        // Handle BC dates
        const isBC = dateStr.toLowerCase().includes('bc');
        let cleanDateStr = dateStr.replace(/bc/gi, '').trim();
        
        // Try different date formats - YYYY-MM-DD first
        const dateFormats = [
            // YYYY-MM-DD (Lithuanian format)
            { regex: /(\d{4})-(\d{1,2})-(\d{1,2})/, parts: [1, 2, 3] },
            // YYYY.MM.DD
            { regex: /(\d{4})\.(\d{1,2})\.(\d{1,2})/, parts: [1, 2, 3] },
            // YYYY/MM/DD
            { regex: /(\d{4})\/(\d{1,2})\/(\d{1,2})/, parts: [1, 2, 3] },
            // DD.MM.YYYY
            { regex: /(\d{1,2})\.(\d{1,2})\.(\d{4})/, parts: [3, 2, 1] },
            // DD/MM/YYYY
            { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, parts: [3, 2, 1] },
            // DD-MM-YYYY
            { regex: /(\d{1,2})-(\d{1,2})-(\d{4})/, parts: [3, 2, 1] },
            // Month name formats (for BC dates)
            { regex: /([a-zA-Z]+)\s+(\d{1,2})\s+(\d{4})/, parts: [3, 1, 2], monthName: true },
            { regex: /(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/, parts: [3, 2, 1], monthName: true }
        ];
        
        for (const format of dateFormats) {
            const match = cleanDateStr.match(format.regex);
            if (match) {
                let day, month, year;
                
                year = parseInt(match[format.parts[0]]);
                if (isBC) year = -year;
                
                if (format.monthName) {
                    const monthName = match[format.parts[1]].toLowerCase();
                    month = getMonthFromName(monthName);
                    if (month === -1) continue; // Invalid month name
                } else {
                    month = parseInt(match[format.parts[1]]);
                }
                
                day = parseInt(match[format.parts[2]]);
                
                // Validate date components
                if (month < 1 || month > 12) continue;
                if (day < 1 || day > 31) continue;
                
                return { day, month, year, original: dateStr };
            }
        }
        
        return null;
    }

    // Helper function to convert month name to number (1-12)
    function getMonthFromName(monthName) {
        const months = {
            'january': 1, 'jan': 1, 'sausis': 1,
            'february': 2, 'feb': 2, 'vasaris': 2,
            'march': 3, 'mar': 3, 'kovas': 3,
            'april': 4, 'apr': 4, 'balandis': 4,
            'may': 5, 'gegužė': 5, 'geguze': 5,
            'june': 6, 'jun': 6, 'birželis': 6, 'birzelis': 6,
            'july': 7, 'jul': 7, 'liepa': 7,
            'august': 8, 'aug': 8, 'rugpjūtis': 8, 'rugpjutis': 8,
            'september': 9, 'sep': 9, 'rugsėjis': 9, 'rugsejis': 9,
            'october': 10, 'oct': 10, 'spalis': 10,
            'november': 11, 'nov': 11, 'lapkritis': 11,
            'december': 12, 'dec': 12, 'gruodis': 12
        };
        
        return months[monthName] || -1;
    }

    // Format date in Lithuanian YYYY-MM-DD format
    function formatDate(date, showFull = false) {
        if (!date) return 'Nežinoma';
        
        let formatted = '';
        if (showFull && date.year) {
            formatted += Math.abs(date.year);
            if (date.year < 0) formatted += ' pr. Kr.';
            formatted += '-';
        }
        
        if (date.month) {
            formatted += (date.month < 10 ? '0' : '') + date.month;
            if (date.day) formatted += '-' + (date.day < 10 ? '0' : '') + date.day;
        }
        
        return formatted;
    }

    // Render character cards in the sidebar (alphabetically sorted)
    function renderCharacterCards() {
        characterCardsContainer.innerHTML = '';
        
        // Sort characters alphabetically by name
        const sortedCharacters = [...characters].sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        
        sortedCharacters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.innerHTML = `
                <img class="character-image" src="${character.image}" alt="${character.name}" onerror="this.src='https://via.placeholder.com/40?text=?'">
                <div class="character-info">
                    <div class="character-name">${character.name}</div>
                    <div class="character-birthdate">${formatDate(character.birthDate, true)}</div>
                </div>
            `;
            
            card.addEventListener('click', () => showCharacterDetail(character));
            characterCardsContainer.appendChild(card);
        });
    }

    // Render the month grid with Lithuanian month names
    function renderMonthGrid() {
        monthGrid.innerHTML = '';
        
        // Group characters by birth month
        const charactersByMonth = Array(12).fill().map(() => []);
        
        characters.forEach(character => {
            if (character.birthDate && character.birthDate.month) {
                const monthIndex = character.birthDate.month - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    charactersByMonth[monthIndex].push(character);
                }
            }
        });
        
        // Sort characters within each month by birth day
        charactersByMonth.forEach(monthCharacters => {
            monthCharacters.sort((a, b) => (a.birthDate.day || 1) - (b.birthDate.day || 1));
        });
        
        // Create month cards
        lithuanianMonths.forEach((monthName, index) => {
            const monthCharacters = charactersByMonth[index];
            if (monthCharacters.length === 0) return;
            
            const monthCard = document.createElement('div');
            monthCard.className = 'month-card';
            
            const monthTitle = document.createElement('div');
            monthTitle.className = 'month-title';
            monthTitle.textContent = monthName;
            
            const birthdayList = document.createElement('div');
            birthdayList.className = 'birthday-list';
            
            monthCharacters.forEach(character => {
                const birthdayItem = document.createElement('div');
                birthdayItem.className = 'birthday-item';
                birthdayItem.innerHTML = `
                    <span>${character.name}</span>
                    <span class="birthday-date">${formatDate(character.birthDate)}</span>
                `;
                
                birthdayItem.addEventListener('click', () => showCharacterDetail(character));
                birthdayList.appendChild(birthdayItem);
            });
            
            monthCard.appendChild(monthTitle);
            monthCard.appendChild(birthdayList);
            monthGrid.appendChild(monthCard);
        });
    }

    // Show character detail view
    function showCharacterDetail(character) {
        currentView = 'detail';
        monthGrid.style.display = 'none';
        characterDetailView.style.display = 'block';
        
        const ageInfo = calculateAgeInfo(character);
        
        characterDetailContent.innerHTML = `
            <div class="detail-header">
                <img class="detail-image" src="${character.image}" alt="${character.name}" onerror="this.src='https://via.placeholder.com/80?text=?'">
                <div>
                    <div class="detail-name">${character.name}</div>
                    <div class="detail-birthdate">Gimimo data: ${formatDate(character.birthDate, true)}</div>
                </div>
            </div>
            <div class="detail-info">
                ${ageInfo}
            </div>
        `;
    }

    // Calculate age information with Lithuanian labels
    function calculateAgeInfo(character) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        const birthYear = character.birthDate.year;
        const birthMonth = character.birthDate.month;
        const birthDay = character.birthDate.day;
        
        let html = '';
        
        // If character has died
        if (character.deathDate && character.deathDate.year) {
            const deathYear = character.deathDate.year;
            const deathMonth = character.deathDate.month || 12;
            const deathDay = character.deathDate.day || 31;
            
            let ageAtDeath = deathYear - birthYear;
            if (deathMonth < birthMonth || (deathMonth === birthMonth && deathDay < birthDay)) {
                ageAtDeath--;
            }
            
            html += `
                <div class="detail-info-item">
                    <span class="detail-info-label">Amžius mirties metu:</span>
                    <span>${ageAtDeath} metai</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">Mirties data:</span>
                    <span>${formatDate(character.deathDate, true)}</span>
                </div>
            `;
        } 
        // If character is still alive (or no death date)
        else {
            let age = currentYear - birthYear;
            if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
                age--;
            }
            
            // Calculate next birthday
            let nextBirthdayYear = currentYear;
            if (currentMonth > birthMonth || (currentMonth === birthMonth && currentDay >= birthDay)) {
                nextBirthdayYear++;
            }
            
            const nextBirthday = new Date(nextBirthdayYear, birthMonth - 1, birthDay);
            const timeUntilBirthday = nextBirthday - today;
            const daysUntil = Math.ceil(timeUntilBirthday / (1000 * 60 * 60 * 24));
            const weeksUntil = Math.floor(daysUntil / 7);
            const monthsUntil = Math.floor(daysUntil / 30);
            
            // Calculate turning age
            const turningAge = nextBirthdayYear - birthYear;
            
            html += `
                <div class="detail-info-item">
                    <span class="detail-info-label">Dabartinis amžius:</span>
                    <span>${age} metai</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">Kitas gimtadienis:</span>
                    <span>${nextBirthdayYear}-${birthMonth < 10 ? '0' + birthMonth : birthMonth}-${birthDay < 10 ? '0' + birthDay : birthDay} (sukaks ${turningAge})</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">Iki kito gimtadienio liko:</span>
                    <span>${monthsUntil} mėn., ${weeksUntil} sav., ${daysUntil % 7} d.</span>
                </div>
            `;
        }
        
        return html;
    }

    // Go back to month grid view
    goBackButton.addEventListener('click', () => {
        currentView = 'grid';
        monthGrid.style.display = 'grid';
        characterDetailView.style.display = 'none';
    });

    // Search functionality
    characterSearch.addEventListener('input', () => {
        const query = characterSearch.value.toLowerCase();
        
        if (query.length === 0) {
            searchResults.style.display = 'none';
            return;
        }
        
        const results = characters.filter(character => 
            character.name.toLowerCase().includes(query)
        );
        
        if (results.length > 0) {
            searchResults.innerHTML = '';
            results.forEach(character => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.textContent = character.name;
                resultItem.addEventListener('click', () => {
                    showCharacterDetail(character);
                    characterSearch.value = '';
                    searchResults.style.display = 'none';
                });
                searchResults.appendChild(resultItem);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div class="no-results">Veikėjų nerasta</div>';
            searchResults.style.display = 'block';
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!characterSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Update special dates (this week and this month birthdays)
    function updateSpecialDates() {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        // Get birthdays in the next 7 days
        const upcomingThisWeek = characters.filter(character => {
            if (!character.birthDate) return false;
            
            const birthMonth = character.birthDate.month;
            const birthDay = character.birthDate.day;
            
            return birthMonth === currentMonth && 
                   birthDay >= currentDay && 
                   birthDay <= currentDay + 7;
        });
        
        // Sort by day
        upcomingThisWeek.sort((a, b) => (a.birthDate.day || 1) - (b.birthDate.day || 1));
        
        // Render this week birthdays as cards
        thisWeekBirthdays.innerHTML = '';
        if (upcomingThisWeek.length > 0) {
            upcomingThisWeek.forEach(character => {
                const card = document.createElement('div');
                card.className = 'character-card small-card';
                card.innerHTML = `
                    <img class="character-image" src="${character.image}" alt="${character.name}" onerror="this.src='https://via.placeholder.com/40?text=?'">
                    <div class="character-info">
                        <div class="character-name">${character.name}</div>
                        <div class="character-birthdate">${formatDate(character.birthDate)}</div>
                    </div>
                `;
                card.addEventListener('click', () => showCharacterDetail(character));
                thisWeekBirthdays.appendChild(card);
            });
        } else {
            thisWeekBirthdays.innerHTML = '<div class="no-birthdays">Šią savaitę gimtadienių nėra</div>';
        }
        
        // Get birthdays later this month (after next 7 days)
        const upcomingThisMonth = characters.filter(character => {
            if (!character.birthDate) return false;
            
            const birthMonth = character.birthDate.month;
            const birthDay = character.birthDate.day;
            
            return birthMonth === currentMonth && birthDay > currentDay + 7;
        });
        
        // Sort by day
        upcomingThisMonth.sort((a, b) => (a.birthDate.day || 1) - (b.birthDate.day || 1));
        
        // Render this month birthdays as cards
        thisMonthBirthdays.innerHTML = '';
        if (upcomingThisMonth.length > 0) {
            upcomingThisMonth.forEach(character => {
                const card = document.createElement('div');
                card.className = 'character-card small-card';
                card.innerHTML = `
                    <img class="character-image" src="${character.image}" alt="${character.name}" onerror="this.src='https://via.placeholder.com/40?text=?'">
                    <div class="character-info">
                        <div class="character-name">${character.name}</div>
                        <div class="character-birthdate">${formatDate(character.birthDate)}</div>
                    </div>
                `;
                card.addEventListener('click', () => showCharacterDetail(character));
                thisMonthBirthdays.appendChild(card);
            });
        } else {
            thisMonthBirthdays.innerHTML = '<div class="no-birthdays">Daugiau gimtadienių šį mėnesį nėra</div>';
        }
    }
});
