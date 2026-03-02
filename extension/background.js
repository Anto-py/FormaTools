// Autorise chrome.storage.session depuis les content scripts
chrome.storage.session.setAccessLevel({
  accessLevel: chrome.storage.AccessLevel.TRUSTED_AND_UNTRUSTED_CONTEXTS
});

let panelWindowId = null;

chrome.action.onClicked.addListener(async () => {
  // Si la fenêtre existe déjà, la mettre au premier plan
  if (panelWindowId !== null) {
    try {
      await chrome.windows.get(panelWindowId);
      chrome.windows.update(panelWindowId, { focused: true });
      return;
    } catch {
      // La fenêtre a été fermée entre-temps
      panelWindowId = null;
    }
  }

  // Positionner en haut à droite de la fenêtre navigateur active
  const currentWin = await chrome.windows.getLastFocused();
  const winLeft = (currentWin.left  ?? 0) + (currentWin.width  ?? 1280) - 340;
  const winTop  = (currentWin.top   ?? 0) + 40;

  const panel = await chrome.windows.create({
    url:    chrome.runtime.getURL('sidepanel.html'),
    type:   'popup',
    width:  320,
    height: 640,
    left:   Math.max(0, winLeft),
    top:    Math.max(0, winTop),
  });

  panelWindowId = panel.id;
});

// Nettoyage quand la fenêtre est fermée
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === panelWindowId) {
    panelWindowId = null;
  }
});
