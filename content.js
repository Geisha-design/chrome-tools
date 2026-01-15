let isSelectMode = false;
let isBoxSelectMode = false;
let overlay = null;
let highlightedElement = null;
let selectionBox = null;
let selectionStart = null;
let selectedElements = [];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'scrape') {
    scrapeData(request.selector, request.attribute)
      .then(data => {
        saveData(data)
          .then(() => {
            sendResponse({ success: true, count: data.length, data: data });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
  } else if (request.action === 'startSelectMode') {
    startSelectMode();
    sendResponse({ success: true });
  } else if (request.action === 'stopSelectMode') {
    stopSelectMode();
    sendResponse({ success: true });
  } else if (request.action === 'startBoxSelectMode') {
    startBoxSelectMode();
    sendResponse({ success: true });
  } else if (request.action === 'stopBoxSelectMode') {
    stopBoxSelectMode();
    sendResponse({ success: true });
  }
  return true;
});

function startSelectMode() {
  if (isSelectMode) return;
  
  isSelectMode = true;
  createOverlay();
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
  document.body.style.cursor = 'crosshair';
}

function stopSelectMode() {
  if (!isSelectMode) return;
  
  isSelectMode = false;
  removeOverlay();
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
  document.body.style.cursor = '';
  
  if (highlightedElement) {
    highlightedElement.style.outline = '';
    highlightedElement = null;
  }
}

function startBoxSelectMode() {
  if (isBoxSelectMode) return;
  
  isBoxSelectMode = true;
  selectedElements = [];
  createSelectionBox();
  document.addEventListener('mousedown', handleBoxMouseDown);
  document.addEventListener('mousemove', handleBoxMouseMove);
  document.addEventListener('mouseup', handleBoxMouseUp);
  document.body.style.cursor = 'crosshair';
  document.body.style.userSelect = 'none';
}

function stopBoxSelectMode() {
  if (!isBoxSelectMode) return;
  
  isBoxSelectMode = false;
  removeSelectionBox();
  clearElementHighlights();
  document.removeEventListener('mousedown', handleBoxMouseDown);
  document.removeEventListener('mousemove', handleBoxMouseMove);
  document.removeEventListener('mouseup', handleBoxMouseUp);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

function createSelectionBox() {
  selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px solid #9c27b0;
    background: rgba(156, 39, 176, 0.2);
    z-index: 2147483647;
    pointer-events: none;
    display: none;
  `;
  document.body.appendChild(selectionBox);
}

function removeSelectionBox() {
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
}

function handleBoxMouseDown(e) {
  if (!isBoxSelectMode) return;
  
  e.preventDefault();
  selectionStart = {
    x: e.clientX,
    y: e.clientY
  };
  
  selectionBox.style.left = selectionStart.x + 'px';
  selectionBox.style.top = selectionStart.y + 'px';
  selectionBox.style.width = '0px';
  selectionBox.style.height = '0px';
  selectionBox.style.display = 'block';
}

function handleBoxMouseMove(e) {
  if (!isBoxSelectMode || !selectionStart) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const width = Math.abs(currentX - selectionStart.x);
  const height = Math.abs(currentY - selectionStart.y);
  const left = Math.min(currentX, selectionStart.x);
  const top = Math.min(currentY, selectionStart.y);
  
  selectionBox.style.left = left + 'px';
  selectionBox.style.top = top + 'px';
  selectionBox.style.width = width + 'px';
  selectionBox.style.height = height + 'px';
  
  highlightElementsInBox(left, top, width, height);
}

function handleBoxMouseUp(e) {
  if (!isBoxSelectMode || !selectionStart) return;
  
  e.preventDefault();
  
  const rect = selectionBox.getBoundingClientRect();
  const elements = getElementsInBox(rect);
  
  if (elements.length > 0) {
    const selector = generateSelectorFromElements(elements);
    
    chrome.runtime.sendMessage({
      action: 'boxSelectionComplete',
      count: elements.length,
      selector: selector,
      elements: elements.map(el => ({
        tagName: el.tagName.toLowerCase(),
        className: el.className,
        id: el.id
      }))
    });
  }
  
  selectionStart = null;
  selectionBox.style.display = 'none';
}

function getElementsInBox(rect) {
  const allElements = document.querySelectorAll('*');
  const elementsInBox = [];
  
  allElements.forEach(el => {
    const elRect = el.getBoundingClientRect();
    
    if (elRect.left >= rect.left &&
        elRect.top >= rect.top &&
        elRect.right <= rect.right &&
        elRect.bottom <= rect.bottom) {
      elementsInBox.push(el);
    }
  });
  
  return elementsInBox;
}

function highlightElementsInBox(left, top, width, height) {
  clearElementHighlights();
  
  const rect = {
    left: left,
    top: top,
    right: left + width,
    bottom: top + height
  };
  
  const elements = getElementsInBox(rect);
  selectedElements = elements;
  
  elements.forEach(el => {
    el.style.outline = '2px solid #9c27b0';
    el.style.backgroundColor = 'rgba(156, 39, 176, 0.1)';
  });
}

function clearElementHighlights() {
  selectedElements.forEach(el => {
    el.style.outline = '';
    el.style.backgroundColor = '';
  });
  selectedElements = [];
}

function generateSelectorFromElements(elements) {
  if (elements.length === 0) return '';
  
  const firstElement = elements[0];
  
  if (firstElement.id) {
    return '#' + firstElement.id;
  }
  
  if (firstElement.className && typeof firstElement.className === 'string') {
    const classes = firstElement.className.split(/\s+/).filter(c => c);
    if (classes.length > 0) {
      return '.' + classes.join('.');
    }
  }
  
  return firstElement.tagName.toLowerCase();
}

function createOverlay() {
  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 2147483646;
    background: rgba(255, 152, 0, 0.1);
    display: none;
  `;
  document.body.appendChild(overlay);
}

function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

function handleMouseOver(e) {
  if (!isSelectMode) return;
  
  const element = e.target;
  
  if (highlightedElement) {
    highlightedElement.style.outline = '';
  }
  
  highlightedElement = element;
  element.style.outline = '3px solid #ff9800';
  
  overlay.style.display = 'block';
  const rect = element.getBoundingClientRect();
  overlay.style.top = rect.top + 'px';
  overlay.style.left = rect.left + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';
}

function handleMouseOut(e) {
  if (!isSelectMode) return;
  
  const element = e.target;
  element.style.outline = '';
  overlay.style.display = 'none';
}

function handleClick(e) {
  if (!isSelectMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  const selector = generateSelector(element);
  
  chrome.runtime.sendMessage({
    action: 'elementSelected',
    selector: selector,
    tagName: element.tagName.toLowerCase(),
    className: element.className
  });
  
  stopSelectMode();
}

function generateSelector(element) {
  if (element.id) {
    return '#' + element.id;
  }
  
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(/\s+/).filter(c => c);
    if (classes.length > 0) {
      return '.' + classes.join('.');
    }
  }
  
  const path = [];
  let current = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += '#' + current.id;
      path.unshift(selector);
      break;
    }
    
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    const siblings = Array.from(current.parentNode.children).filter(
      child => child.tagName === current.tagName
    );
    
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }
    
    path.unshift(selector);
    current = current.parentNode;
  }
  
  return path.join(' > ');
}

function scrapeData(selector, attribute) {
  return new Promise((resolve, reject) => {
    try {
      const elements = document.querySelectorAll(selector);
      const data = [];
      
      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const item = {
          index: index + 1,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          position: {
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          xpath: getXPath(element),
          cssPath: getCssPath(element),
          tagName: element.tagName.toLowerCase(),
          id: element.id || '',
          className: element.className || ''
        };

        if (attribute && attribute !== 'text') {
          item.value = element.getAttribute(attribute) || '';
          item.attribute = attribute;
        } else {
          item.value = element.textContent.trim();
          item.attribute = 'text';
        }

        data.push(item);
      });

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

function getXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = current.previousSibling;
    
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    
    const tagName = current.tagName.toLowerCase();
    const pathIndex = index > 0 ? `[${index + 1}]` : '';
    parts.unshift(`${tagName}${pathIndex}`);
    
    current = current.parentNode;
  }
  
  return parts.length ? '/' + parts.join('/') : '';
}

function getCssPath(element) {
  if (element.id) {
    return '#' + element.id;
  }
  
  const path = [];
  let current = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += '#' + current.id;
      path.unshift(selector);
      break;
    }
    
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    const siblings = Array.from(current.parentNode.children).filter(
      child => child.tagName === current.tagName
    );
    
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }
    
    path.unshift(selector);
    current = current.parentNode;
  }
  
  return path.join(' > ');
}

function saveData(newData) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['scrapedData'], function(result) {
      const existingData = result.scrapedData || [];
      const combinedData = [...existingData, ...newData];
      
      chrome.storage.local.set({ scrapedData: combinedData }, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}











