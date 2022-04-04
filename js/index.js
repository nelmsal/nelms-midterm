/* eslint-disable no-undef */
/* globals showdown */

const map = L.map('map').setView([0, 0], 0);
const layerGroup = L.layerGroup().addTo(map);
let tripCollection = { features: [] };
let stopCollection = { features: [] };

L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.',
}).addTo(map);

/* ==========

## Step 1: Slide Content

Think about how to represent your slides. What information do you want to show
for each slide?
- Probably a title and some descriptive text.
- Should the text be related to the map data?
- Do you want to show any images?

What do you want the map or the data on the map to do when you go to a different
slide?
- Should it pan and zoom to specific features?
- Should it highlight or show a popup on any features?
- Should the features shown be filtered?

## Step 2: App Behavior

Think about what you want/need your application to do. It's often helpful to
frame these app behaviors in a "When... then..." format. For example:
- When I click the "⧏" button, then the app should show the slide before the
  current one.
- When I click the "⧐" button, then the app should show the slide after the
  current one.
- When the page loads, then the app should show the first slide.

These behavior descriptions can help you determine what functions you need to
write. For example, the behaviors above imply that you should have functions to
handle the next/previous button clicks, and a function to show a given slide.

## Step 3: Function Signatures

========== */

let currentSlideIndex = 0;

const slideTitleDiv = document.querySelector('.slide-title');
const slideContentDiv = document.querySelector('.slide-content');
const slidePrevButton = document.querySelector('#prev-slide');
const slideNextButton = document.querySelector('#next-slide');
const slideJumpSelect = document.querySelector('#jump-to-slide');

function updateMap(collection) {
  layerGroup.clearLayers();
  const geoJsonLayer = L.geoJSON(collection, { pointToLayer: (p, latlng) => L.marker(latlng) })
    .bindTooltip((l) => l.feature.properties.label)
    .addTo(layerGroup);
  return geoJsonLayer;
}

function makeEraCollection(era) {
  return {
    type: 'FeatureCollection',
    features: lifeCollection.features.filter((f) => f.properties.Era === era),
  };
}

function showSlide(slide, TripNum) {
  const converter = new showdown.Converter({ smartIndentationFix: true });

  slideTitleDiv.innerHTML = `<h2>${slide.EraName}</h2><br></br><h2>${slide.TripName}</h2>`;
  slideContentDiv.innerHTML = converter.makeHtml(slide.content);

  const collection = slide.Era ? makeEraCollection(slide.Era) : lifeCollection;
  const layer = updateMap(collection);

  function handleFlyEnd() {
    if (slide.showpopups) {
      layer.eachLayer((l) => {
        l.bindTooltip(l.feature.properties.label, { permanent: true });
        l.openTooltip();
      });
    }
    map.removeEventListener('moveend', handleFlyEnd);
  }

  map.addEventListener('moveend', handleFlyEnd);
  if (slide.bounds) {
    map.flyToBounds(slide.bounds);
  } else if (slide.Era) {
    map.flyToBounds(layer.getBounds());
  }
}

function showCurrentSlide() {
  const slide = slides[currentSlideIndex];
  showSlide(slide, currentSlideIndex + 1);
}

function goNextSlide() {
  currentSlideIndex += 1;

  if (currentSlideIndex === slides.length) {
    currentSlideIndex = 0;
  }

  currentTrip = currentSlideIndex + 1;

  showCurrentSlide();
}

function goPrevSlide() {
  currentSlideIndex -= 1;

  if (currentSlideIndex < 0) {
    currentSlideIndex = slides.length - 1;
  }

  showCurrentSlide();
}

function jumpToSlide() {
  currentSlideIndex = parseInt(slideJumpSelect.value, 10);
  showCurrentSlide();
}

function initSlideSelect() {
  slideJumpSelect.innerHTML = '';
  for (const [index, slide] of slides.entries()) {
    const option = document.createElement('option');
    option.value = index;
    option.innerHTML = slide.title;
    slideJumpSelect.appendChild(option);
  }
}

function loadLifeData() {
  fetch('data/journey.json')
    .then((resp) => resp.json())
    .then((data) => {
      lifeCollection = data;
      showCurrentSlide();
    });
}

slidePrevButton.addEventListener('click', goPrevSlide);
slideNextButton.addEventListener('click', goNextSlide);
slideJumpSelect.addEventListener('click', jumpToSlide);

initSlideSelect();
showCurrentSlide();
loadLifeData();
