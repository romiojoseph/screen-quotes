document.addEventListener('DOMContentLoaded', () => {
    const initialQuoteBox = document.getElementById('initial-quote');
    const initialCharacterBox = document.getElementById('initial-character');
    const feedShowSelect = document.getElementById('feed-show-select');
    const searchInput = document.getElementById('search');
    const filterSelect = document.getElementById('filter');
    const quoteFeed = document.getElementById('quote-feed');

    let allQuotes = [];
    let shownQuotes = [];
    let characterImages = {};
    let currentShow = 'office';
    const shows = ['office', 'friends', 'modern-family', 'parks-and-recreation', 'the-big-bang-theory'];

    // Fetch all quotes from all shows
    fetchAllQuotes();

    // Fetch the character images JSON
    fetch('assets/character.json')
        .then(response => response.json())
        .then(data => {
            characterImages = data.images;
            displayQuoteFeed(allQuotes);
            displayRandomQuote();
        })
        .catch(error => console.error('Error loading the character images:', error));

    feedShowSelect.addEventListener('change', () => {
        const selectedShow = feedShowSelect.value;
        if (selectedShow) {
            currentShow = selectedShow;
            fetchQuotes(selectedShow);
        }
    });

    searchInput.addEventListener('input', filterQuotes);
    filterSelect.addEventListener('change', filterQuotes);

    function fetchAllQuotes() {
        let promises = shows.map(show => fetchQuotes(show, true));
        Promise.all(promises)
            .then(() => fetchQuotes(currentShow))
            .catch(error => console.error('Error loading the quotes:', error));
    }

    function fetchQuotes(show, isHero = false) {
        return fetch(`assets/${show}-quotes.json`)
            .then(response => response.json())
            .then(data => {
                if (isHero) {
                    allQuotes = allQuotes.concat(data.quotes);
                } else {
                    allQuotes = data.quotes;
                    populateFilter(allQuotes);
                    displayQuoteFeed(allQuotes);
                }
            })
            .catch(error => console.error('Error loading the quotes:', error));
    }

    function populateFilter(quotes) {
        filterSelect.innerHTML = '<option value="">Filter by character</option>';
        const characters = [...new Set(quotes.map(quote => quote.character))];
        characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character;
            option.textContent = character;
            filterSelect.appendChild(option);
        });
    }

    function displayRandomQuote() {
        const availableQuotes = allQuotes.filter(quote => !shownQuotes.includes(quote));
        if (availableQuotes.length === 0) {
            shownQuotes = [];
            displayRandomQuote();
        } else {
            const randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
            shownQuotes.push(randomQuote);
            const imgUrl = characterImages[randomQuote.character]?.image;
            initialQuoteBox.innerHTML = `
                <img src="${imgUrl}?cache=${new Date().getTime()}" alt="${randomQuote.character}" class="hero-image">
                <p id="initial-quote">${randomQuote.quote}</p>
                <p id="initial-character">- ${randomQuote.character}</p>
            `;
        }
    }

    function displayQuoteFeed(quotes) {
        quoteFeed.innerHTML = '';
        const shuffledQuotes = shuffleArray(quotes);
        shuffledQuotes.forEach(quote => {
            const quoteItem = document.createElement('div');
            quoteItem.className = 'quote-item';
            const imgUrl = characterImages[quote.character]?.image;
            const alias = characterImages[quote.character]?.alias || '';
            quoteItem.innerHTML = `
                <div class="profile">
                    <img src="${imgUrl}?cache=${new Date().getTime()}" alt="${quote.character}" class="feed-image">
                    <div class="character-info">
                        <p>${quote.character}</p>
                        <p class="alias">${alias}</p>
                    </div>
                    <i class="ph-duotone ph-clipboard-text copy-icon"></i>
                </div>
                <p class="character-quote">${quote.quote}</p>
            `;
            quoteFeed.appendChild(quoteItem);

            const copyIcon = quoteItem.querySelector('.copy-icon');
            copyIcon.addEventListener('click', (event) => {
                event.preventDefault();
                copyToClipboard(`${quote.quote}\n\n- ${quote.character}`);
            });
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function filterQuotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCharacter = filterSelect.value;

        let filteredQuotes = allQuotes.filter(quote =>
            quote.quote.toLowerCase().includes(searchTerm)
        );

        if (selectedCharacter) {
            filteredQuotes = filteredQuotes.filter(quote =>
                quote.character === selectedCharacter
            );
        }

        displayQuoteFeed(filteredQuotes);
    }

    function copyToClipboard(text) {
        navigator.permissions.query({ name: 'clipboard-write' }).then(permissionStatus => {
            if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
                navigator.clipboard.writeText(text)
                    .then(() => alert('Quote copied to clipboard!'))
                    .catch(err => {
                        console.error('Clipboard API failed:', err);
                        fallbackCopyToClipboard(text);
                    });
            } else {
                fallbackCopyToClipboard(text);
            }
        }).catch(err => {
            console.error('Permission query failed:', err);
            fallbackCopyToClipboard(text);
        });
    }

    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        textArea.setAttribute('readonly', '');
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);

        textArea.select();
        textArea.setSelectionRange(0, text.length);

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert('Quote copied to clipboard!');
            } else {
                alert('Failed to copy. Please try manually.');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }

        document.body.removeChild(textArea);
    }
});
