/* eslint-disable no-undef */
/* globals showdown */

const map = L.map('map').setView([0, 0], 0);
const layerGroup = L.layerGroup().addTo(map);

// trip routes as lines
let tripCollection = { features: [] };
// stops as points
let stopCollection = { features: [] };

let currentSlideIndex = 0;

const imageLocation = '';

// MAPBOX TILES
// STYLE IS LIGHT GREY WITH SOME CUSTOM NEIGHBORHOOD LABELS
const mbAccessToken = 'pk.eyJ1IjoibmVsbXMiLCJhIjoiY2wycWZldnQ0MDA0cTNscGE0bmdwZW1qNiJ9.WAtQnoSeY6VaN38L5X-lEA';
const mbID = 'nelms';
const mbStyle = 'cl33po8r6000115ofophf8n7d';
L.tileLayer(`https://api.mapbox.com/styles/v1/${mbID}/${mbStyle}/tiles/256/{z}/{x}/{y}?access_token=${mbAccessToken}`, {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);



// 1. SLIDES
// CREATE SLIDES
const slideTitleDiv = document.querySelector('.slide-title');
const slideContentDiv = document.querySelector('.slide-content');
const slidePrevButton = document.querySelector('#prev-slide');
const slideNextButton = document.querySelector('#next-slide');
const slideJumpSelect = document.querySelector('#jump-to-slide');

// CURRENT, NEXT & PREVIOUS SLIDE
function showCurrentSlide() {
  const slide = slides[currentSlideIndex];
  // eslint-disable-next-line no-use-before-define
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

// GET TRIP LINES
function loadStopData() {
  fetch('data/stops.json')
    .then((resp) => resp.json())
    .then((data) => {
      stopCollection = data;
      showCurrentSlide();
    });
}
function loadTripData() {
  fetch('data/trips.json')
    .then((resp) => resp.json())
    .then((data) => {
      tripCollection = data;
      showCurrentSlide();
    });
}
function styleLines(feature) {
  return {
    color: feature.properties.Color,
    weight: 10,
    opacity: 0.7,
    lineJoin: 'round',
  };
}
function showTripData(collection) {
  const tripLayer = L.geoJSON(collection, {
    style: styleLines,
  });
  return tripLayer;
}

// UPDATE MAP
const majorLogo = L.icon({
  iconUrl: 'https://img.icons8.com/cotton/452/plus--v2.png',
  iconSize: [25, 25],
  iconAnchor: [0, 0],
  tooltipAnchor: [0, 0],
});
const sideLogo = L.icon({
  iconUrl: 'https://img.icons8.com/cotton/452/plus--v1.png',
  iconSize: [20, 20],
  iconAnchor: [0, 0],
  tooltipAnchor: [0, 0],
});
const attractLogo = L.icon({
  iconUrl: 'https://img.icons8.com/cotton/344/plus--v3.png',
  iconSize: [15, 15],
  iconAnchor: [0, 0],
  tooltipAnchor: [0, 0],
});
const otherLogo = L.icon({
  iconUrl: 'https://img.icons8.com/material-outlined/344/unchecked-circle.png',
  iconSize: [15, 15],
  iconAnchor: [0, 0],
  tooltipAnchor: [0, 0],
});
const getLogo = (importance) => {
  let logo = sideLogo;
  if (importance === 'Main') {
    logo = majorLogo;
  }
  if (importance === 'Attraction') {
    logo = attractLogo;
  }
  if (importance === 'Pitstop') {
    logo = otherLogo;
  }
  return logo;
};
function updateMap(sCollection, tCollection) {
  layerGroup.clearLayers();
  const stopLayer = L.geoJSON(sCollection, {
    pointToLayer: (p, latlng) => L.marker(latlng, {
      riseOnHover: true,
      icon: getLogo(p.properties.Importance),
    }),
    // onEachFeature: onEachFeature,
  })
    .bindTooltip((l) => `<h3>${l.feature.properties.CityName}</h3>`)
    .addTo(layerGroup);
  showTripData(tCollection)
    .addTo(layerGroup);
  return stopLayer;
}

function makeEraCollection(era, collection) {
  return {
    type: 'FeatureCollection',
    features: collection.features.filter((f) => f.properties.Era === era),
  };
}

function correctBounds(bounds) {
  const newBounds = [
    [bounds[0][1], bounds[0][0]],
    [bounds[1][1], bounds[1][0]],
  ];
  return newBounds;
}

function showSlide(slide) {
  const converter = new showdown.Converter({ smartIndentationFix: true });

  slideTitleDiv.innerHTML = `<h2>${slide.EraName}</h2><br></br><h2>${slide.TripName}</h2>`;
  slideContentDiv.innerHTML = converter.makeHtml(slide.content);

  const sCollection = slide.Era ? makeEraCollection(slide.Era, stopCollection) : stopCollection;
  const tCollection = slide.Era ? makeEraCollection(slide.Era, tripCollection) : stopCollection;
  const stopLayer = updateMap(sCollection, tCollection);

  function handleFlyEnd() {
    if (slide.showpopups) {
      stopLayer.eachLayer((l) => {
        l.bindTooltip(l.feature.properties.label, { permanent: true });
        l.openTooltip();
      });
    }
    map.removeEventListener('moveend', handleFlyEnd);
  }

  map.addEventListener('moveend', handleFlyEnd);
  if (slide.bounds) {
    map.flyToBounds(correctBounds(slide.bounds));
  } else if (slide.Era) {
    map.flyToBounds(layer.getBounds());
  }
}

function slideTitle(slide) {
  title = slide.EraName;
  if (slide.TripName.length > 1) {
    title = `${title}: ${slide.TripName}`;
  }
  return title;
}

function initSlideSelect() {
  slideJumpSelect.innerHTML = '';
  for (const [index, slide] of slides.entries()) {
    const option = document.createElement('option');
    option.value = index;
    option.innerHTML = slideTitle(slide);
    slideJumpSelect.appendChild(option);
  }
}

slidePrevButton.addEventListener('click', goPrevSlide);
slideNextButton.addEventListener('click', goNextSlide);
slideJumpSelect.addEventListener('click', jumpToSlide);

initSlideSelect();
showCurrentSlide();
loadStopData();
loadTripData();
