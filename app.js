const isLocalhost = location.pathname === '/';

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = e => {
      if (e.data.error) {
        reject(e.data.error);
      } else {
        resolve(e.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
  });
}

document.addEventListener('DOMContentLoaded', _ => {
  const cacheList = document.querySelector('#cache-list');
  const cacheName = document.querySelector('#cache-name');
  const addCache = document.querySelector('#add-cache');
  const deleteCache = document.querySelector('#delete-cache');
  const listCache = document.querySelector('#list-cache');

  addCache.addEventListener('click', e => {
    let value = cacheName.value;

    if (value.length === 0) {
      return;
    }

    sendMessage({
      command : 'add',
      url     : value
    })
    .then(data => {
      let option = document.createElement('option');
      option.textContent = `${location.href}${cacheName.value}`;
      cacheList.appendChild(option);
    })
    .catch(error => console.error(error));
  });

  deleteCache.addEventListener('click', e => {
    let value = cacheList.value;

    if (value.length === 0) {
      return;
    }

    sendMessage({
      command : 'delete',
      url     : value
    })
    .then(data => {
      let selected = cacheList.childNodes[cacheList.selectedIndex];
      selected.remove();
    })
    .catch(error => console.error(error));
  });

  listCache.addEventListener('click', e => {
    sendMessage({
      command : 'list'
    })
    .then(data => {
      while (cacheList.firstChild) {
        cacheList.removeChild(cacheList.firstChild);
      }

      for (let url of data.urls) {
        let option = document.createElement('option');
        option.textContent = url;
        cacheList.appendChild(option);
      }
    });
  });

  listCache.click();
});

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js', {
    scope : isLocalhost ? '/' : '/sw-sandbox/'
  })
  .then(registration => {
    console.table(registration);
    return navigator.serviceWorker.ready;
  })
  .then(() => {
    navigator.serviceWorker.getRegistration()
      .then(registration => {
        console.table(registration);
      });

    if (navigator.serviceWorker.controller) {
      return Promise.resolve(navigator.serviceWorker.controller);
    }

    return new Promise(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', _ => {
        resolve(navigator.serviceWorker.controller);
      });
    });
  })
  .then(controller => {
    console.log('Service Worker is ready');
  });
}
