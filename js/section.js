// templates of contents
const contentImgTemplate = document.querySelector('#template-content--i');
const contentDateAbstractImgTemplate = document.querySelector('#template-content--d-a-i');

// containers to append contents
const sectionPageTitle = document.querySelector('#section-page-title');
const sectionPageTop = document.querySelector('#section-page-top .section__body');
const sectionPageSearchResult = document.querySelector('#search-result');

// for event listeners and inteersection observer
const sortByDate = document.querySelector('#sort-date');
const searchBar = document.querySelector('.search-bar__input > input[type="search"]');
const loader = document.querySelector('.search-result__loader');
var currentObserver = null;
var currentArticles = null;

// for inputs from header search
const headerSearchSubmitInputs = Array.from(document.querySelectorAll('.header-search-container .header-search-input'));
const headerSearchSubmitButtons = Array.from(document.querySelectorAll('.header-search-container .btn-submit'));
headerSearchSubmitInputs[0].addEventListener('input', (e) => {
	headerSearchSubmitInputs[1].value = headerSearchSubmitInputs[0].value;
});
headerSearchSubmitInputs[1].addEventListener('input', (e) => {
	headerSearchSubmitInputs[0].value = headerSearchSubmitInputs[1].value;
});
headerSearchSubmitButtons.forEach((button) => {
	button.addEventListener('click', (e) => {
		sessionStorage.setItem('searched', headerSearchSubmitInputs[0].value);
	});
});

// create skeleton contents by default
for (let i = 0; i < 4; i++) {
	sectionPageTop.append(contentImgTemplate.content.cloneNode(true));
	sectionPageSearchResult.append(contentDateAbstractImgTemplate.content.cloneNode(true));
}

// function to get data from nytimes

var articles = null;

if (sessionStorage.getItem('articles') === null) {
	const urls = [
		'https://api.nytimes.com/svc/topstories/v2/home.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
		'https://api.nytimes.com/svc/topstories/v2/arts.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
		'https://api.nytimes.com/svc/topstories/v2/business.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
		'https://api.nytimes.com/svc/topstories/v2/politics.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
		'https://api.nytimes.com/svc/topstories/v2/technology.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
		'https://api.nytimes.com/svc/topstories/v2/world.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
	];

	Promise.all(urls.map((url) => fetch(url)))
		.then((responses) => {
			responses.forEach((response) => {
				if (response.status !== 200) throw new Error(response.status);
			});
			return Promise.all(responses.map((response) => response.json()));
		})
		.then((responses) => {
			let articles = {};
			responses.forEach((response) => {
				articles[response.section.toLowerCase()] = response.results.filter(isArticle).filter(hasImg);
			});
			sessionStorage.setItem('articles', JSON.stringify(articles));
			show();
		})
		.catch((err) => {
			console.log(err.message);
			const main = document.querySelector('main');

			if (err.message == '429') {
				main.innerHTML = `<section class="error-message">
										<div class="error-message__icon">
											<img src="/icons/sad.svg" alt="broken heart" />
										</div>
										<div class="error-message__text">
											<h1>Huhu!</h1>
												<p>We've reached the rate limit. The NYTimes API only allows ten uninterrupted requests per minute.</p>
												<p>This usually do not take a while, please wait a few seconds and hit refresh.</p>
										</div>
									</section>`;
			} else {
				main.innerHTML = `<section class="error-message">
										<div class="error-message__icon">
											<img src="/icons/heart-broken.svg" alt="broken heart" />
										</div>
										<div class="error-message__text">
											<h1>Oh no!</h1>
												<p>Something went wrong while fetching data. This should not be the case.</p>
												<p>Please let me know by sending me an email 
													(<a href="mailto:lingga.abdulrahman.u@gmail.com?subject=NYTimes Top Stories Project Error">lingga.abdulrahman.u@gmail.com</a>).</p>
												<p>Thank you and sorry for all the inconvenience.</p>
										</div>
									</section>`;
			}
		});
} else {
	articles = JSON.parse(sessionStorage.getItem('articles'))[section];
	show();
}

function show() {
	currentArticles = articles.slice(4);

	addContentsSectionPageTop(articles.slice(0, 4));
	addContentsSectionPageSearchResult(articles.slice(4));

	sortByDate.addEventListener('change', (e) => {
		addContentsSectionPageSearchResult(sortContentsDate(e.target.value, currentArticles));
	});

	searchBar.addEventListener('input', () => {
		if (searchBar.value === null || searchBar.value.match(/^ *$/) !== null) {
			addContentsSectionPageSearchResult(sortContentsDate(sortByDate.value, articles.slice(4)));
			currentArticles = articles.slice(4);
		} else {
			const searchBarValue = searchBar.value.toLowerCase();
			let searchedArticles = searchContents(searchBarValue, articles);
			searchedArticles = sortContentsDate(sortByDate.value, searchedArticles);

			if (searchedArticles.length === 0) {
				currentObserver.unobserve(loader);
				loader.classList.add('inactive');
				sectionPageSearchResult.innerHTML = `<div class="no-result-msg">
											  <h2>It looks like there isn't any match for '${searchBar.value}'</h2>
											  <span>Please visit the official site for wider coverage of contents.</span>
											  <div>`;
			} else {
				addContentsSectionPageSearchResult(searchedArticles);
			}
		}
	});
}

function isArticle(content) {
	return content.item_type === 'Article';
}

function hasImg(content) {
	return content.multimedia !== null;
}

function searchContents(keyword, contents) {
	let searchedArticles = [];
	searchedArticles = contents.filter((content) => {
		return (
			content.title.toLowerCase().includes(keyword) ||
			content.byline.slice(3).toLowerCase().includes(keyword) ||
			content.subsection.toLowerCase().includes(keyword)
		);
	});

	return searchedArticles;
}

function addContentsSectionPageTop(contents) {
	sectionPageTop.innerHTML = '';

	for (let index = 0; index < contents.length; index++) {
		sectionPageTop.append(createContent(1, contents[index]));
	}
}

function addContentsSectionPageSearchResult(contents) {
	const options = { root: null, rootMargin: '0px', threshold: 0.05 };
	const observer = new IntersectionObserver(loadMoreContents, options);

	sectionPageSearchResult.innerHTML = '';
	let index = 0;
	let limit = 0;

	contents.length > 6 ? (limit = 6) : (limit = contents.length);
	for (; index < limit; index++) {
		sectionPageSearchResult.append(createContent(4, contents[index]));
	}

	if (currentObserver != null) {
		currentObserver.unobserve(loader);
		loader.classList.remove('inactive');
	}
	currentObserver = observer;
	observer.observe(loader);

	function loadMoreContents(entries, observer) {
		if (entries[0].isIntersecting) {
			if (index < contents.length) {
				loader.classList.remove('inactive');
				sectionPageSearchResult.append(createContent(4, contents[index]));
				index = index + 1;
			} else {
				loader.classList.add('inactive');
			}
		}
	}
}

function sortContentsDate(value, contents) {
	let sortedContents = JSON.parse(JSON.stringify(contents));

	switch (value) {
		case 'newest':
			sortedContents.sort((a, b) => {
				return new Date(b.updated_date) - new Date(a.updated_date);
			});
			break;

		case 'oldest':
			sortedContents.sort((a, b) => {
				return new Date(a.updated_date) - new Date(b.updated_date);
			});
			break;

		default:
			sortedContents = contents;

			break;
	}

	return sortedContents;
}

function createContent(type, article) {
	let div = null;
	switch (true) {
		case type == 4:
			div = contentDateAbstractImgTemplate.content.cloneNode(true);
			const dateOptions = { weekday: 'short', year: '2-digit', month: 'short', day: 'numeric' };
			const articleDate = new Date(article.updated_date);
			div.getElementById('content-date').textContent = articleDate.toLocaleDateString('en-US', dateOptions);

		case type == 3:
			if (type == 3) div = contentImgTemplate.content.cloneNode(true);
			const imgElement = div.getElementById('content-thumbnail');
			imgElement.src = article.multimedia[0].url;
			imgElement.alt = article.multimedia[0].caption;
			div.getElementById('content-abstract').textContent = article.abstract;

		case type == 2:
			if (type == 2) {
				div = contentAbstractTemplate.content.cloneNode(true);
				div.getElementById('content-abstract').textContent = article.abstract;
			}

		case type == 1:
			if (type == 1) {
				div = contentImgTemplate.content.cloneNode(true);
				const imgElement = div.getElementById('content-thumbnail');
				imgElement.src = article.multimedia[0].url;
				imgElement.alt = article.multimedia[0].caption;
			}

		case type == 0:
			if (type == 0) div = contentTitleTemplate.content.cloneNode(true);
			div.getElementById('content-src').href = article.url;
			div.getElementById('content-title').textContent = article.title;
			div.getElementById('content-writers').textContent = article.byline;
			break;

		default:
			console.log('argument type does not match with any case');
	}

	return div;
}
