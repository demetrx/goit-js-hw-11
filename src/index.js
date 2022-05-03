import './sass/main.scss';
import throttle from 'lodash.throttle';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import QueryAPI from './js/query-api.js';
import photoCardsTpl from './templates/photo-cards.hbs';

const queryAPI = new QueryAPI();
const lightbox = new SimpleLightbox('.gallery a');
const refs = {
  searchForm: document.querySelector('#search-form'),
  gallery: document.querySelector('#gallery'),
  loadMoreBtn: document.querySelector('#load-more'),
};

let totalHits = 0;
let isEndReached = false;

refs.searchForm.addEventListener('submit', onSearch);
refs.loadMoreBtn.addEventListener('click', onLoadMore);
window.addEventListener('scroll', throttle(makeInfScroll, 500));

async function onSearch(e) {
  e.preventDefault();

  const value = e.currentTarget.elements.searchQuery.value;

  queryAPI.setSearchQuery(value);

  try {
    const data = await queryAPI.fetchImgs();
    onSearchFinished(data);
  } catch (error) {
    onError(error);
  }
}

async function onLoadMore() {
  if (isEndReached) {
    return;
  }

  disableLoadMoreBtn();

  if (totalHits <= queryAPI.getFetchedElsNum()) {
    isEndReached = true;
    notifyOfEndOfResults();
    return;
  }

  try {
    const data = await queryAPI.fetchImgs();
    onLoadMoreFinished(data);
  } catch (error) {
    onError(error);
  }
}

function onSearchFinished(data) {
  clearGallery();

  const matches = data.hits;
  if (matches.length === 0) {
    notifyOfMissingMatches();
    return;
  }

  totalHits = data.totalHits;
  isEndReached = false;
  notifyOfMatchesNum(data.totalHits);
  renderMarkup(matches);
  lightbox.refresh();
  scrollToTop();
  enableLoadMoreBtn();
}

function onLoadMoreFinished(data) {
  renderMarkup(data.hits);
  lightbox.refresh();
  enableLoadMoreBtn();
}

function renderMarkup(list) {
  const markup = photoCardsTpl(list);
  refs.gallery.insertAdjacentHTML('beforeend', markup);
}

function makeInfScroll() {
  const documentRect = document.documentElement.getBoundingClientRect();
  if (documentRect.bottom < document.documentElement.clientHeight + 1400) {
    onLoadMore();
  }
}

function notifyOfMissingMatches() {
  Notify.failure('Sorry, there are no images matching your search query. Please try again.');
}

function notifyOfMatchesNum(totalHits) {
  Notify.success(`Hooray! We found ${totalHits} images.`);
}

function notifyOfEndOfResults() {
  Notify.info("We're sorry, but you've reached the end of search results.");
}

function clearGallery() {
  refs.gallery.innerHTML = '';
}

function disableLoadMoreBtn() {
  refs.loadMoreBtn.classList.add('hidden');
}

function enableLoadMoreBtn() {
  refs.loadMoreBtn.classList.remove('hidden');
}

function scrollToTop() {
  const { top: cardTop } = refs.gallery.getBoundingClientRect();

  window.scrollBy({
    top: cardTop - 100,
    behavior: 'smooth',
  });
}

function onError(error) {
  console.dir(error);
}
