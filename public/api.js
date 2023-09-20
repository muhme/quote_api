/**
 * returns parameter language if browser language is one of our supported languages
 * e.g. language=uk
 * else return empty string to use default
 */
function languageParameter() {
  const supportedLanguages = ['de', 'en', 'es', 'ja', 'uk'];
  let browserLanguage = navigator.language || navigator.userLanguage;

  // pick only first two letters, as browser language may includes a region code, e.g., "en-US"
  browserLanguage = browserLanguage.substring(0, 2).toLowerCase();

  if (supportedLanguages.includes(browserLanguage)) {
    return `?language=${browserLanguage}`;
  } else {
    return '';
  }
}

async function fetchQuote() {
  try {
    languageParameter = languageParameter();
    // console.log(`languageParameter=${languageParameter}`);
    const randomQuote = `/v1/quote${languageParameter}`;

    quoteLabel = document.getElementById('quoteLabel');
    // if usable language found show it the user
    // e.g. as "Data sample for your browser language=de"
    if (languageParameter) {
      quoteLabel.appendChild(
        document.createTextNode(
          ` for your browser ${languageParameter.substring(1)}`,
        ),
      );
    }

    // link "Data Sample *" to the used quote URL
    const linkElement = document.createElement('a');
    linkElement.href = randomQuote;
    linkElement.textContent = quoteLabel.textContent;
    // replace div content with the anchor element
    quoteLabel.innerHTML = '';
    quoteLabel.appendChild(linkElement);

    const response = await fetch(randomQuote);
    const data = await response.json();
    // console.log(data);

    const quoteAuthorSource = document.getElementById('quoteAuthorSource');

    // quote, quotes link and author name exist always
    document.getElementById('quoteText').innerText = data.quote.trim();
    document.getElementById('quoteLink').href = data.link;

    // if author link exists than add link to authors name
    const authorName = data.authorName;
    if (typeof data.authorLink !== 'undefined') {
      // w/ link
      const linkElement = document.createElement('a');
      linkElement.href = data.authorLink;
      linkElement.innerText = authorName;
      quoteAuthorSource.appendChild(linkElement);
    } else {
      // w/o link
      quoteAuthorSource.appendChild(document.createTextNode(authorName));
    }

    // if source exists than add after authors name
    const quoteSource = data.source;
    if (typeof quoteSource !== 'undefined') {
      // separate by comma and space
      quoteAuthorSource.appendChild(document.createTextNode(', '));

      // with link?
      if (typeof data.sourceLink !== 'undefined') {
        // w/ link
        const linkElement = document.createElement('a');
        linkElement.href = data.sourceLink;
        linkElement.innerText = quoteSource;
        quoteAuthorSource.appendChild(linkElement);
      } else {
        // w/o link
        quoteAuthorSource.appendChild(document.createTextNode(quoteSource));
      }
    }
  } catch (error) {
    console.error('Error retrieving the quote:', error);
  }
}

window.onload = fetchQuote;
