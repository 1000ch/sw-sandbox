let cacheNumber = 0;
let cacheKey = `sw-sandbox-${cacheNumber}`;

self.addEventListener('message', e => {
  let promise = caches.open(cacheKey)
    .then(cache => {
      let command = e.data.command;
      let url = e.data.url;
      switch (command) {
        case 'add':
          let request = new Request(url, {
            mode : 'no-cors'
          });
          return fetch(request)
            .then(response => {
              return cache.put(url, response);
            })
            .then(_ => {
              e.ports[0].postMessage({
                url   : url,
                error : null
              });
            });
        case 'delete':
          return cache.delete(url)
            .then(succeed => {
              e.ports[0].postMessage({
                error : succeed ? null : `${url} is not found in the cache for ${cacheKey}`
              });
            });
        case 'list':
          return cache.keys()
            .then(response => {
              e.ports[0].postMessage({
                urls  : response.map(request => request.url),
                error : null
              });
            });
        case 'clear':
          return cache.keys()
            .then(response => {
              return Promise.all(response.map(request => {
                return cache.delete(request.url);
              }));
            })
            .then(() => {
              e.ports[0].postMessage({
                error : null
              });
            });
        case 'purge':
          return caches.keys()
            .then(cacheKeys => {
              return Promise.all(cacheKeys.map(cacheKey => {
                return caches.delete(cacheKey);
              }));
            })
            .then(() => {
              cacheNumber++;
              e.ports[0].postMessage({
                error : null
              });
            });
        default:
          return Promise.resolve()
            .then(_ => {
              e.ports[0].postMessage({
                error : `${command} is invalid command`
              });
            });
      }
    })
    .catch(error => {
      console.error(error);
    });

  e.waitUntil(promise);
});

self.addEventListener('install', e => {
  let promise = caches.open(cacheKey)
    .then(cache => {
      return cache.addAll([]);
    })
    .catch(error => {
      console.log(error);
    });

  e.waitUntil(promise);
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(cacheKey)
      .then(cache => cache.match(e.request))
      .then(response => {
        if (response) {
          console.log(`Cache was found for ${e.request.url}`);
          return response;
        } else {
          console.log(`Cache was NOT found for ${e.request.url}`);
          return fetch(e.request);
        }
      })
      .catch(error => {
        console.error(error);
      })
  );
});
