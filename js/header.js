const header = document.querySelector('header');

const headerNavSection = header.querySelector('.header-navigation-container--section nav');
const headerNavAction = header.querySelector('.header-navigation-container--action nav');
const headerSearchContainer = header.querySelector('nav + .header-search-container');

const hamburgerIcon = header.querySelector('#btn-hamburger');
const actionIcon = header.querySelector('#btn-action');
const searchIcon = header.querySelector('#btn-search');

const searchInputHeader = header.querySelector('#header-search--header');
const searchInputNav = header.querySelector('#header-search--nav');

const closeIcons = Array.from(header.querySelectorAll('.btn-icon--close'));

hamburgerIcon.addEventListener('click', (e) => {
	activateElement(headerNavSection, closeIcons, e);
	focusElement(searchInputNav);
});

actionIcon.addEventListener('click', (e) => {
	activateElement(headerNavAction, closeIcons, e);
});

searchIcon.addEventListener('click', (e) => {
	headerSearchContainer.classList.toggle('inactive');
	focusElement(searchInputHeader);
});

function focusElement(element) {
	element.focus();
}

function inactivateElement(elementContainer, closeIcons, e1) {
	const offClick = (e2) => {
		if (!elementContainer.contains(e2.target) || closeIcons.includes(e2.target)) {
			elementContainer.classList.add('inactive');
			document.removeEventListener('click', offClick);
		}
	};
	e1.stopPropagation();
	document.addEventListener('click', offClick, true);
	window.onresize = () => {
		elementContainer.classList.add('inactive');
	};
}

function activateElement(elementContainer, closeIcons, e1) {
	if (elementContainer.classList.contains('inactive')) {
		elementContainer.classList.remove('inactive');
		inactivateElement(elementContainer, closeIcons, e1);
	}
}
