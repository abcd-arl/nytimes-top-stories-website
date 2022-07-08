const homePage = document.querySelector('#home-page');

// templates for sections
const sectionTopTemplate = homePage.querySelector('#template-section-top');
const sectionSplitTemplate = homePage.querySelector('#template-section-split');
const sectionAllImgTemplate = homePage.querySelector('#template-section-all-img');
const sectionAllAbstractTemplate = homePage.querySelector('#template-section-all-abstract');

// templates for contents
const contentTitleTemplate = homePage.querySelector('#template-content--t');
const contentAbstractTemplate = homePage.querySelector('#template-content--a');
const contentImgTemplate = homePage.querySelector('#template-content--i');
const contentAbstractImgTemplate = homePage.querySelector('#template-content--a-i');

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

// create sections and skeleton contents by default
homePage.append(sectionTopTemplate.content.cloneNode(true));
homePage.append(sectionSplitTemplate.content.cloneNode(true));
homePage.append(sectionAllImgTemplate.content.cloneNode(true));
homePage.append(sectionAllAbstractTemplate.content.cloneNode(true));

/* ============ get and display contents from nytimes api ============ */

// set all needed urls

var articles = null;

if (sessionStorage.getItem('articles') === null) {
	let urls = null;
	if (sessionStorage.setURLSDefault) {
		urls = [
			'json/home.json',
			'json/arts.json',
			'json/business.json',
			'json/politics.json',
			'json/technology.json',
			'json/world.json',
		];
	} else {
		urls = [
			'https://api.nytimes.com/svc/topstories/v2/home.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
			'https://api.nytimes.com/svc/topstories/v2/arts.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
			'https://api.nytimes.com/svc/topstories/v2/business.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
			'https://api.nytimes.com/svc/topstories/v2/politics.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
			'https://api.nytimes.com/svc/topstories/v2/technology.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
			'https://api.nytimes.com/svc/topstories/v2/world.json?api-key=Tnvbu9EtAVibnUG5FKRSWVjamDjyaPhD',
		];
	}

	Promise.all(urls.map((url) => fetch(url)))
		.then((responses) => {
			responses.forEach((response) => {
				if (response.status !== 200) throw new Error(response.status);
			});
			return Promise.all(responses.map((response) => response.json()));
		})
		.then((responses) => {
			articles = {};
			responses.forEach((response) => {
				articles[response.section.toLowerCase()] = response.results.filter(isArticle).filter(hasImg);
			});
			sessionStorage.setItem('articles', JSON.stringify(articles));

			show();
		})
		.catch((err) => {
			console.log(err.message);
			const main = document.querySelector('main');
			main.style.pointerEvents = 'unset';

			if (err.message == '429') {
				main.innerHTML = `<section class="error-message">
										<div class="error-message__icon">
											<img src="icons/sad.svg" alt="broken heart" />
										</div>
										<div class="error-message__text">
											<h1>Huhu!</h1>
												<p>We've reached the rate limit. The NYTimes API only allows ten uninterrupted requests per minute.</p>
												<p>This usually do not take a while, please wait a few seconds and hit refresh.</p>
												<p><br>If you prefer, you may click <span class='to-default-contents'>here</span> to show the default contents instead.</p>
										</div>
									</section>`;
			} else {
				main.innerHTML = `<section class="error-message">
										<div class="error-message__icon">
											<img src="icons/heart-broken.svg" alt="broken heart" />
										</div>
										<div class="error-message__text">
											<h1>Oh no!</h1>
											<p>Something went wrong while fetching data. Are you sure you are online?</p>
											<p>If yes, this should not be the case. Please let me know by sending me an <a href="mailto:lingga.abdulrahman.u@gmail.com?subject=NYTimes Top Stories Project Error">email</a>.</p>
											<p>Thank you and sorry for all the inconvenience.</p>
											<p><br>In the meantime, you may click <span class='to-default-contents'>here</span> to show the default contents instead.</p>
										</div>
									</section>`;
			}

			setToDefaultContents();
		});
} else {
	articles = JSON.parse(sessionStorage.getItem('articles'));
	show();
}

function show() {
	const main = document.querySelector('main');
	main.style.pointerEvents = 'unset';
	homePage.innerHTML = '';
	addContentsSectionTop(articles['home'][0]);

	addContentsSectionSplit(articles['home'].slice(1, 8));
	addContentsSectionAllAbstract(
		'World',
		noDuplicatesToHomeSection('all abstract', articles['world news']),
		'world.html'
	);
	addContentsSectionAllImg('Business', noDuplicatesToHomeSection('all img', articles['business']), 'business.html');

	addContentsSectionSplit(articles['home'].slice(8, 15));
	addContentsSectionAllImg(
		'U.S. Politics',
		noDuplicatesToHomeSection('all img', articles['u.s. politics']),
		'politics.html'
	);

	addContentsSectionSplit(articles['home'].slice(15, 22));
	addContentsSectionAllImg('Arts', noDuplicatesToHomeSection('all img', articles['arts']), 'arts.html');
	addContentsSectionAllAbstract(
		'Technology',
		noDuplicatesToHomeSection('all abstract', articles['technology']),
		'technology.html'
	);
}

// only take articles w/o duplication in home section
function noDuplicatesToHomeSection(type, sectionArticles) {
	const homeArticleTitles = {};
	for (let i = 0; i < articles['home'].length; i++) {
		homeArticleTitles[articles['home'][i].title] = i;
	}

	let noDuplicate = [];
	switch (type) {
		case 'all img':
			for (let i = 0; noDuplicate.length < 4; i++) {
				sectionArticles[i].title in homeArticleTitles ? 1 + 1 : noDuplicate.push(sectionArticles[i]);
			}
			break;

		case 'all abstract':
			for (let i = 0; noDuplicate.length < 6; i++) {
				sectionArticles[i].title in homeArticleTitles ? 1 + 1 : noDuplicate.push(sectionArticles[i]);
			}
			break;

		default:
			console.log('argument type does not match with any case');
	}

	return noDuplicate;
}

/* ============ ======================================= ============ */

function setToDefaultContents() {
	const toDefaults = document.querySelectorAll('.to-default-contents');
	toDefaults.forEach((toDefault) => {
		toDefault.addEventListener('click', (e) => {
			sessionStorage.setURLSDefault = true;
			location.reload();
		});
	});
}

function isArticle(article) {
	return article.item_type === 'Article';
}

function hasImg(content) {
	return content.multimedia !== null;
}

function addContentsSectionTop(article) {
	const section = sectionTopTemplate.content.cloneNode(true);
	section.querySelectorAll('.content').forEach((content) => {
		content.remove();
	});

	section.querySelector('#section-top').append(createContent(3, article));
	homePage.append(section);
}

function addContentsSectionSplit(articles) {
	const section = sectionSplitTemplate.content.cloneNode(true);
	section.querySelectorAll('.content').forEach((content) => {
		content.remove();
	});

	const sectionLeft = section.querySelector('.left');
	const sectionRight = section.querySelector('.right');

	sectionLeft.querySelector('.left > div:nth-child(1)').append(createContent(2, articles[0]));
	sectionLeft.querySelector('.left > div:nth-child(1)').append(createContent(2, articles[1]));
	sectionLeft.querySelector('.left > div:nth-child(2)').append(createContent(3, articles[2]));
	sectionLeft.querySelector('.left > div:nth-child(3)').append(createContent(3, articles[3]));

	sectionRight.querySelector('.right > div:nth-child(1)').append(createContent(3, articles[4]));
	sectionRight.querySelector('.right > div:nth-child(2)').append(createContent(0, articles[5]));
	sectionRight.querySelector('.right > div:nth-child(2)').append(createContent(0, articles[6]));

	homePage.append(section);
}

function addContentsSectionAllImg(sectionTitle, articles, seeMoreLink) {
	const section = sectionAllImgTemplate.content.cloneNode(true);
	section.querySelectorAll('.content').forEach((content) => {
		content.remove();
	});

	const sectionHeader = section.querySelector('#section-all-img > .section__header');
	const sectionBody = section.querySelector('#section-all-img > .section__body');
	const seeMore = section.querySelector('#section-src');

	sectionHeader.querySelector('#section-title').innerHTML = sectionTitle;
	sectionHeader.querySelector('a').innerHTML = 'See more';
	seeMore.href = seeMoreLink;

	articles.forEach((article) => {
		sectionBody.append(createContent(1, article));
	});
	homePage.append(section);
}

function addContentsSectionAllAbstract(sectionTitle, articles, seeMoreLink) {
	const section = sectionAllAbstractTemplate.content.cloneNode(true);
	section.querySelectorAll('.content').forEach((content) => {
		content.remove();
	});

	const sectionHeader = section.querySelector('#section-all-abstract > .section__header');
	const sectionBody = section.querySelector('#section-all-abstract > .section__body');
	const seeMore = section.querySelector('#section-src');

	sectionHeader.querySelector('#section-title').innerHTML = sectionTitle;
	sectionHeader.querySelector('a').innerHTML = 'See more';
	seeMore.href = seeMoreLink;

	for (let i = 0; i < 3; i++) {
		sectionBody.querySelector('div:nth-child(1)').append(createContent(2, articles[i]));
		sectionBody.querySelector('div:nth-child(2)').append(createContent(2, articles[i + 3]));
	}
	homePage.append(section);
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
			if (type == 3) div = contentAbstractImgTemplate.content.cloneNode(true);
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
