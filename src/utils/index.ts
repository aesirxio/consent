const cleanHostName = (name: string) => {
  return name.replace(/^www./, '');
};
const getYoutubeID = (src: string) => {
  const match = src.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  if (match && Array.isArray(match) && match[2] && match[2].length === 11) return match[2];
  return false;
};
const randomString = (length: number, allChars = true) => {
  const chars = `${
    allChars ? `0123456789` : ''
  }ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz`;
  const response = [];
  for (let i = 0; i < length; i++) response.push(chars[Math.floor(Math.random() * chars.length)]);
  if (!allChars) return response.join('');
  return btoa(response.join('')).replace(/=+$/, '');
};
const escapeRegex = (literal: string) => {
  return literal.replace(/[.*+?^${}()[\]\\]/g, '\\$&');
};

const unBlockScripts = (disabledBlockDomains: any) => {
  window['configBlockJS']._backupNodes = window['configBlockJS']?._backupNodes.filter(
    ({ position, node, uniqueID }: any) => {
      try {
        const blockJSDomains = [
          ...(Array.isArray(window?.aesirxBlockJSDomains) ? window.aesirxBlockJSDomains : []),
          ...(Array.isArray(window?.aesirxHoldBackJS)
            ? window.aesirxHoldBackJS.map((item: any) => ({
                domain: null,
                blocking_permanent: 'off',
                ...item,
              }))
            : []),
        ];
        const isPermanentBlocked = blockJSDomains?.some(
          (item: any) => node.src.includes(item.domain) && item.blocking_permanent === 'on'
        );
        if (isPermanentBlocked) return false;
        const arrayDisabledBlockDomains = window['disabledBlockJSDomains']?.length
          ? window['disabledBlockJSDomains']
          : disabledBlockDomains
            ? Array.isArray(disabledBlockDomains)
              ? disabledBlockDomains
              : JSON.parse(disabledBlockDomains)
            : [];
        const containsDomain = arrayDisabledBlockDomains?.length
          ? arrayDisabledBlockDomains?.some((item: any) => {
              const regex = new RegExp(escapeRegex(item.domain || ''));
              return regex.test(node.src);
            })
          : false;
        if (!containsDomain) {
          if (node.nodeName.toLowerCase() === 'script') {
            const scriptNode = document.createElement('script');
            scriptNode.src = node.src;
            scriptNode.type = 'text/javascript';
            document[position].appendChild(scriptNode);
          } else {
            const frame = document.getElementById(uniqueID);
            if (!frame) return false;
            const iframe: any = document.createElement('iframe');
            iframe.src = node.src;
            iframe.width = frame.offsetWidth;
            iframe.height = frame.offsetHeight;
            frame.parentNode.insertBefore(iframe, frame);
            frame.parentNode.removeChild(frame);
          }
        }
        return false;
      } catch (error) {
        console.error(error);
        return false;
      }
    }
  );
};

const addProviderToList = (node: any, cleanedHostname: string) => {
  const nodeCategory =
    node.hasAttribute('data-aesirxconsent') && node.getAttribute('data-aesirxconsent');
  if (!nodeCategory) return;
  const categoryName = nodeCategory.replace('aesirxconsent-', '');
  const provider = configBlockJS?._providersToBlock?.find(({ re }: any) => re === cleanedHostname);
  if (!provider) {
    configBlockJS._providersToBlock.push({
      re: cleanedHostname,
      categories: [categoryName],
      fullPath: false,
    });
  } else if (!provider.isOverridden) {
    provider.categories = [categoryName];
    provider.isOverridden = true;
  } else if (!provider.categories.includes(categoryName)) provider.categories.push(categoryName);
};

const addPlaceholder = (htmlElm: any, uniqueID: string) => {
  const shortCodeData = configBlockJS._shortCodes.find(
    (code: any) => code.key === 'video_placeholder'
  );
  const videoPlaceHolderDataCode = shortCodeData.content;
  const { offsetWidth, offsetHeight } = htmlElm;
  if (offsetWidth === 0 || offsetHeight === 0) return;
  htmlElm.insertAdjacentHTML(
    'beforebegin',
    `${videoPlaceHolderDataCode}`.replace('[UNIQUEID]', uniqueID)
  );
  const addedNode = document.getElementById(uniqueID);
  addedNode.style.width = `${offsetWidth}px`;
  addedNode.style.height = `${offsetHeight}px`;
  const innerTextElement: HTMLElement = document.querySelector(
    `#${uniqueID} .video-placeholder-text-normal`
  );
  innerTextElement.style.display = 'block';
  innerTextElement.style.backgroundColor = '#000';
  innerTextElement.style.borderColor = '#000';
  innerTextElement.style.color = '#fff';
  const youtubeID = getYoutubeID(htmlElm.src);
  if (!youtubeID) return;
  addedNode.classList.replace('video-placeholder-normal', 'video-placeholder-youtube');
  addedNode.style.backgroundImage = `linear-gradient(rgba(76,72,72,.7),rgba(76,72,72,.7)),url('https://img.youtube.com/vi/${youtubeID}/maxresdefault.jpg')`;
  innerTextElement.classList.replace(
    'video-placeholder-text-normal',
    'video-placeholder-text-youtube'
  );
};
const shouldBlockProvider = (formattedRE: string) => {
  const provider = configBlockJS._providersToBlock.find(({ re }: any) =>
    new RegExp(escapeRegex(re)).test(formattedRE)
  );
  const params = new URLSearchParams(window.location.search);
  const consentParams = params.get('consent');
  const isPermanentBlocked = window['aesirxBlockJSDomains']?.some(
    (item: any) => formattedRE.includes(item.domain) && item.blocking_permanent === 'on'
  );
  if (
    (sessionStorage.getItem('aesirx-analytics-allow') || consentParams === 'yes') &&
    !isPermanentBlocked
  )
    return false;
  return provider && true;
};

const blockScripts = (mutations: any) => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      if (
        !node.src ||
        !node.nodeName ||
        !['script', 'iframe'].includes(node.nodeName.toLowerCase())
      )
        continue;
      try {
        const urlToParse = node.src.startsWith('//')
          ? `${window.location.protocol}${node.src}`
          : node.src;
        const { hostname, pathname } = new URL(urlToParse);
        const cleanedHostname = cleanHostName(`${hostname}${pathname}`);
        addProviderToList(node, cleanedHostname);
        if (!shouldBlockProvider(cleanedHostname)) continue;
        const uniqueID = randomString(8, false);
        if (node.nodeName.toLowerCase() === 'iframe') addPlaceholder(node, uniqueID);
        else {
          node.type = 'javascript/blocked';
          const scriptEventListener = function (event: Event) {
            event.preventDefault();
            node.removeEventListener('beforescriptexecute', scriptEventListener);
          };
          node.addEventListener('beforescriptexecute', scriptEventListener);
        }
        const position =
          document.head.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
            ? 'head'
            : 'body';
        node.remove();
        configBlockJS._backupNodes.push({
          position: position,
          node: node.cloneNode(),
          uniqueID,
        });
      } catch (error) {
        console.log('error', error);
      }
    }
  }
};

const isSixMonthsApart = (datetime, expiration) => {
  const start = new Date(datetime.replace(' ', 'T'));
  const end = new Date(expiration.replace(' ', 'T'));

  const sixMonthsLater = new Date(start);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  return sixMonthsLater.getTime() === end.getTime();
};
export {
  cleanHostName,
  getYoutubeID,
  randomString,
  escapeRegex,
  unBlockScripts,
  addProviderToList,
  addPlaceholder,
  shouldBlockProvider,
  blockScripts,
  isSixMonthsApart,
};
