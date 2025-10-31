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
          ...window?.aesirxBlockJSDomains,
          ...window?.aesirxHoldBackJS.map((item) => ({
            domain: null,
            blocking_permanent: 'off',
            ...item,
          })),
        ];
        const isPermanentBlocked = blockJSDomains.some(
          (item: any) => node.src.includes(item.domain) && item.blocking_permanent === 'on'
        );
        if (isPermanentBlocked) return false;
        const arrayDisabledBlockDomains = window['disabledBlockJSDomains']?.length
          ? window['disabledBlockJSDomains']
          : disabledBlockDomains
            ? JSON.parse(disabledBlockDomains)
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
export { cleanHostName, getYoutubeID, randomString, escapeRegex, unBlockScripts };
