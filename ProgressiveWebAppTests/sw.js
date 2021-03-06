﻿//When the service worker is updated, I need to increment this guy
//or hash or somewhere or something.
//Then the activate function will invalidate old caches when the server worker is updated.
var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
  '/Content/css/bootstrap.min.css',
  '/Content/css/freelancer.min.css',
  '/Scripts/bootstrap.min.js',
  '/Scripts/freelancer.min.js'
];
//Cache these by default, since we'll need it regardless.
self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

//cache everything as you get it anyway
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
        	console.log('read from cache');
          	return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        var fetchRequest = event.request.clone();
        console.log('Cloning request');

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

//remove old caches if they don't match the cache name 
//Though depending on the site, we may or may not want to invalidate
//certain items that will never change.
self.addEventListener('activate', function(e) {
  console.log('ServiceWorker Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== CACHE_NAME) {
          console.log('ServiceWorker removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});