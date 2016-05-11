const isLocalhost = location.pathname === '/';

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.addEventListener('message', e => {
      if (e.data.error) {
        reject(e.data.error);
      } else {
        resolve(e.data);
      }
    });

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
  });
}

document.addEventListener('DOMContentLoaded', _ => {
  const cacheList = document.querySelector('#cache-list');
  const cacheName = document.querySelector('#cache-name');
  const addCache = document.querySelector('#add-cache');
  const deleteCache = document.querySelector('#delete-cache');

  addCache.addEventListener('click', _ => {
    sendMessage({
      command : 'add',
      url     : cacheName.value
    })
    .then(data => {
      let option = document.createElement('option');
      option.textContent = cacheName.value;
      cacheList.appendChild(option);
    })
    .catch(error => console.error(error));
  });

  deleteCache.addEventListener('click', _ => {
    sendMessage({
      command : 'delete',
      url     : cacheList.value
    })
    .then(data => {
      let selected = cacheList.childNodes[cacheList.selectedIndex];
      selected.remove();
    })
    .catch(error => console.error(error));
  });
});

if (navigator.serviceWorker) {
  let controllerChanged = new Promise(resolve => {
    navigator.serviceWorker.addEventListener('controllerchange', _ => {
      resolve();
    });
  });

  navigator.serviceWorker.register('sw.js', {
    scope : isLocalhost ? '/' : '/sw-sandbox/'
  })
  .then(registration => {
    console.table(registration);
    return navigator.serviceWorker.ready;
  })
  .then(_ => {
    if (navigator.serviceWorker.controller) {
      return Promise.resolve();
    }

    return controllerChanged;
  })
  .then(_ => {
    console.log('Service Worker is ready');
  });
}
