const products = [
  {
    id: 372737,
    title: 'ST-DP421VF-GR',
    manufacturer: 'Smartec',
    quantity: 1,
    step: 1,
    unit: 'шт',
    yourPrice: 4680,
    retailPrice: 5200,
    availability: 'Доступность: до 3 дней',
    stock: false,
    image: 'assets/product-372737.jpg',
    favorite: true,
    selected: true,
  },
  {
    id: 362801,
    honestSign: true,
    title: 'MR-TWC-9U-600/450-GD-BK',
    manufacturer: 'Мирарус',
    quantity: 1,
    step: 1,
    unit: 'шт',
    yourPrice: 14920.09,
    retailPrice: 16577.88,
    availability: 'В наличии >10 шт',
    stock: true,
    image: 'assets/product-362801.jpg',
    favorite: false,
    selected: true,
  },
  {
    id: 334239,
    title: 'Корпус пластиковый навесной TEKFOR КМПн-18 IP65 черная прозрачная дверь (TF5-KP72-N-18-65-K03-K02)',
    manufacturer: 'IEK',
    quantity: 1,
    step: 1,
    unit: 'шт',
    yourPrice: 4307.57,
    retailPrice: 7510.73,
    availability: 'В наличии 1 шт',
    stock: true,
    sale: true,
    image: 'assets/product-334239.jpeg',
    favorite: false,
    selected: true,
  },
  {
    id: 291173,
    title: 'SH-05F-9U60/60 (7064c)',
    manufacturer: 'CABEUS',
    quantity: 1,
    step: 1,
    unit: 'шт',
    yourPrice: 17310.20,
    retailPrice: 19233.55,
    availability: 'В наличии 1 шт',
    stock: true,
    image: 'assets/product-291173.jpg',
    favorite: false,
    selected: true,
  },
  {
    id: 216212,
    honestSign: true,
    title: 'КПСнг(А)-FRLS 1х2х0,5 (Технокабель-НН)',
    manufacturer: 'Технокабель-НН',
    quantity: 0.2,
    step: 0.2,
    unit: 'км',
    yourPrice: 23626.97,
    retailPrice: 26252.19,
    availability: 'В наличии >1 км',
    stock: true,
    image: 'assets/product-216212.jpeg',
    favorite: false,
    selected: true,
  },
];

// A refresh restarts the prototype; ordinary flow links still open their scenario.
if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
  const startUrl = new URL(window.location.href);
  startUrl.searchParams.delete('mode');
  startUrl.hash = '';
  window.history.replaceState({}, '', startUrl);
}
const requestedMode = new URLSearchParams(window.location.search).get('mode');
const isAddingFlow = requestedMode === 'add';
let isCatalogVisible = isAddingFlow;
let isRegistered = requestedMode === 'registered';
document.body.classList.toggle('is-mode-selection', !['guest', 'registered', 'add'].includes(requestedMode));
document.body.classList.toggle('is-guest', !isRegistered);
document.body.classList.toggle('is-add-flow', isAddingFlow);
if (!['guest', 'registered', 'add'].includes(requestedMode)) document.title = 'Выбор пользователя — ТД ТИНКО';

let carts = [{ id: 'main', name: 'Основная корзина', products: isAddingFlow ? [] : products.map((item) => ({ ...item })) }];
let activeCartId = 'main';
let pendingAction = null;
let solutions = isAddingFlow ? [] : [{ ...structuredClone(solutionSeed), instanceId: 'solution-1' }];
let nextSolutionId = 2;
let editingSolutionId = null;
let previewSectionId = 'main';

const tabs = document.querySelector('#cart-tabs');
const additionalInfo = document.querySelector('#additional-cart-info');
const contentGrid = document.querySelector('#content-grid');
const itemsRoot = document.querySelector('#cart-items');
const emptyState = document.querySelector('#empty-state');
const selectAll = document.querySelector('#select-all');
const deleteSelected = document.querySelector('#delete-selected');
const summary = document.querySelector('#summary-card');
const modalLayer = document.querySelector('#modal-layer');
const toast = document.querySelector('#toast');
const solutionsPanel = document.querySelector('#solutions-panel');
const cartPreviewTrigger = document.querySelector('#cart-preview-trigger');
const cartPreview = document.querySelector('#cart-preview');
const cartPreviewOverlay = document.querySelector('#cart-preview-overlay');
const cartPreviewClose = document.querySelector('#cart-preview-close');
const cartPreviewList = document.querySelector('#cart-preview-list');
const cartPreviewDetail = document.querySelector('#cart-preview-detail');
const cartPreviewTriggerBadge = document.querySelector('#cart-preview-trigger-badge');
const cartPreviewTriggerTotal = document.querySelector('#cart-preview-trigger-total');
const accountButton = document.querySelector('#account-button');
const catalogRoot = document.querySelector('#catalog-flow');
const cartPage = document.querySelector('.page-shell');

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const money = (value) => `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(roundMoney(value)).replace(/\u00a0/g, ' ')} ₽`;
const priceMarkup = (value, className = '') => {
  const text = money(value);
  const parts = text.match(/^(.*)(,\d{2} ₽)$/);
  return `<span class="${className}">${esc(parts ? parts[1] : text)}<span class="kopeks">${esc(parts ? parts[2] : '')}</span></span>`;
};
const customerPriceKey = () => isRegistered ? 'yourPrice' : 'retailPrice';
const lineTotal = (item, price = customerPriceKey()) => roundMoney(item[price] * item.quantity);
const getActiveCart = () => carts.find((cart) => cart.id === activeCartId);
const hasAdditional = () => (isRegistered || isAddingFlow) && carts.some((cart) => cart.id === 'additional');
const plural = (count) => {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return 'позиций';
  if (n1 === 1) return 'позиция';
  if (n1 > 1 && n1 < 5) return 'позиции';
  return 'позиций';
};
const solutionPlural = (count) => {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return 'решений';
  if (n1 === 1) return 'решение';
  if (n1 > 1 && n1 < 5) return 'решения';
  return 'решений';
};

function getPreviewSections() {
  const cartSections = carts.filter((cart) => isRegistered || isAddingFlow || cart.id === 'main').map((cart) => ({
    id: cart.id,
    name: cart.name,
    kind: 'cart',
    items: cart.products,
    count: cart.products.length,
    total: cart.products.reduce((sum, item) => sum + lineTotal(item), 0),
  }));
  if (!solutions.length) return cartSections;
  return [...cartSections, {
    id: 'solutions',
    name: 'Типовые решения',
    kind: 'solutions',
    items: solutions,
    count: solutions.length,
    total: solutions.reduce((sum, solution) => sum + solutionTotal(solution) * solution.quantity, 0),
  }];
}

const badgeText = (count) => count > 99 ? '99+' : String(count);

function registrationOfferTemplate(total, compact = false) {
  return `<div class="registration-offer${compact ? ' is-compact' : ''}">
    <span class="registration-offer-icon" aria-hidden="true"><img src="assets/registration-tag.svg" alt=""></span>
    <p>Купите за <strong>${priceMarkup(roundMoney(total * .85))}</strong>${compact ? '<br>' : ' '}после <button type="button" class="registration-link">регистрации</button>${compact ? '' : ' на сайте'}</p>
  </div>`;
}

function renderAccount() {
  accountButton.classList.toggle('is-registered', isRegistered);
  accountButton.setAttribute('aria-label', isRegistered ? 'Личный кабинет' : 'Войти');
  accountButton.innerHTML = isRegistered
    ? '<img src="assets/user-checked.svg" alt="">'
    : '<img src="assets/user.svg" alt=""><span>Войти</span>';
}

function signIn() {
  closeCartPreview();
  isRegistered = true;
  document.body.classList.remove('is-mode-selection', 'is-guest');
  const url = new URL(window.location.href);
  url.searchParams.set('mode', isAddingFlow ? 'add' : 'registered');
  window.history.replaceState({}, '', url);
  document.title = 'Корзина — ТД ТИНКО';
  render();
}

function previewItemTemplate(item, kind) {
  const isSolution = kind === 'solutions';
  const priced = isSolution
    ? { ...item, yourPrice: solutionTotal(item), retailPrice: solutionTotal(item, 'retailPrice') }
    : item;
  const quantity = quantityValue(item);
  return `<article class="cart-preview-product" data-preview-kind="${kind}" data-preview-item="${esc(isSolution ? item.instanceId : item.id)}">
    <div class="cart-preview-product-visual"><img class="cart-preview-product-image" src="${item.image}" alt=""></div>
    <div class="cart-preview-product-copy">
      <a class="cart-preview-product-title" href="#">${esc(item.title)}</a>
      ${metadataTemplate(item)}
      ${isSolution ? '<button class="preview-edit-solution" type="button"><img src="assets/edit-solution.svg" alt="">Редактировать состав</button>' : ''}
    </div>
    <div class="cart-preview-product-controls">
      <span class="cart-preview-product-quantity">x${esc(quantity)}</span>
      <div class="cart-preview-product-actions">
        <button class="cart-preview-action preview-favorite" type="button" aria-label="${item.favorite ? 'Убрать из избранного' : 'В избранное'}" aria-pressed="${Boolean(item.favorite)}"><img src="assets/${item.favorite ? 'favorite-filled' : 'row-favorite'}.svg" alt=""></button>
        <button class="cart-preview-action preview-remove" type="button" aria-label="Удалить"><img src="assets/row-trash.svg" alt=""></button>
      </div>
    </div>
    ${priceTemplate(priced, isSolution ? 'С учетом скидки' : undefined)}
  </article>`;
}

function previewDetailTemplate(section) {
  if (!section.count) {
    return `<div class="cart-preview-empty">
      <div class="empty-illustration" aria-hidden="true"><img src="assets/empty-basket-new.svg" alt=""><span>0</span></div>
      <div><h3>В корзине пусто</h3><p>Выбирайте товары в каталоге или через поиск<br>и добавляйте их в корзину</p></div>
      <button class="cart-preview-catalog" type="button">Перейти в каталог</button>
    </div>`;
  }
  return `<div class="cart-preview-products">${section.items.map((item) => previewItemTemplate(item, section.kind)).join('')}</div>
    <div class="cart-preview-footer${isRegistered ? '' : ' is-guest'}">
      <div class="cart-preview-footer-main">
        <button class="cart-preview-open" type="button" data-preview-open="${section.id}">Перейти в корзину</button>
        <div class="cart-preview-total"><span>Сумма итого:</span><strong>${priceMarkup(section.total)}</strong></div>
      </div>
      ${isRegistered ? '' : `<div class="summary-divider"></div>${registrationOfferTemplate(section.total)}`}
    </div>`;
}

function renderCartPreview() {
  const sections = getPreviewSections();
  const availableIds = sections.map((section) => section.id);
  if (!availableIds.includes(previewSectionId)) {
    previewSectionId = availableIds.includes(activeCartId) ? activeCartId : sections[0].id;
  }
  const currentSection = sections.find((section) => section.id === previewSectionId);
  const isMultiple = sections.length > 1;
  const totalCount = sections.reduce((sum, section) => sum + section.count, 0);
  const populatedSections = sections.filter((section) => section.count > 0);
  const onlyPopulatedSection = populatedSections.length === 1 ? populatedSections[0] : null;
  cartPreviewTriggerTotal.hidden = !onlyPopulatedSection;
  cartPreviewTriggerTotal.innerHTML = onlyPopulatedSection
    ? `<span>На сумму:</span><strong>${money(onlyPopulatedSection.total)}</strong>`
    : '';
  cartPreviewTrigger.classList.toggle('has-total', Boolean(onlyPopulatedSection));
  cartPreview.classList.toggle('is-multiple', isMultiple);
  cartPreview.classList.toggle('is-empty', !isMultiple && currentSection.count === 0);
  cartPreviewList.hidden = !isMultiple;
  cartPreviewList.innerHTML = isMultiple ? sections.map((section) => {
    return `<button class="cart-preview-selector${section.id === previewSectionId ? ' is-active' : ''}" type="button" data-preview-section="${section.id}"${section.id === previewSectionId ? ' aria-current="true"' : ''}>
      <span class="cart-preview-selector-copy"><span>${esc(section.name)}</span><span>${priceMarkup(section.total)}</span></span>
      <span class="cart-count-badge${section.count === 0 ? ' is-empty' : ''}">${badgeText(section.count)}</span>
    </button>`;
  }).join('') : '';
  cartPreviewDetail.innerHTML = previewDetailTemplate(currentSection);
  cartPreviewTriggerBadge.textContent = badgeText(totalCount);
  cartPreviewTriggerBadge.hidden = totalCount === 0;
  if (!cartPreview.hidden) positionCartPreview();
}

function positionCartPreview() {
  const headerBottom = Math.max(0, document.querySelector('.site-header').getBoundingClientRect().bottom);
  const triggerRight = cartPreviewTrigger.getBoundingClientRect().right;
  const width = cartPreview.offsetWidth;
  const left = Math.max(16, Math.min(triggerRight - width, document.documentElement.clientWidth - width - 16));
  document.documentElement.style.setProperty('--cart-preview-top', `${headerBottom + 6}px`);
  document.documentElement.style.setProperty('--cart-preview-left', `${left}px`);
  document.documentElement.style.setProperty('--cart-preview-overlay-top', `${headerBottom}px`);
  sizeCartPreview();
}

function sizeCartPreview() {
  if (cartPreview.hidden) return;
  const sections = getPreviewSections();
  const measure = document.createElement('div');
  measure.className = 'cart-preview-measure';
  measure.setAttribute('aria-hidden', 'true');
  measure.innerHTML = sections.filter((section) => section.count).map(previewDetailTemplate).join('');
  cartPreview.append(measure);
  const lists = [...measure.querySelectorAll('.cart-preview-products')];
  const footerHeight = measure.querySelector('.cart-preview-footer')?.getBoundingClientRect().height ?? 0;
  const minimumListHeights = [];
  const listHeights = lists.map((list) => {
    const rows = list.querySelectorAll('.cart-preview-product');
    const firstImage = rows[0].querySelector('.cart-preview-product-image').getBoundingClientRect();
    minimumListHeights.push(firstImage.top + firstImage.height / 2 - list.getBoundingClientRect().top);
    if (rows.length > 3) {
      const image = rows[2].querySelector('.cart-preview-product-image').getBoundingClientRect();
      return image.top + image.height / 2 - list.getBoundingClientRect().top;
    }
    return list.getBoundingClientRect().height;
  });
  const hasEmptySection = sections.some((section) => !section.count);
  const naturalListHeight = lists.length
    ? Math.max(...listHeights, hasEmptySection ? Math.max(0, 226 - footerHeight) : 0)
    : 354;
  const headerHeight = cartPreview.querySelector('.cart-preview-header').getBoundingClientRect().height;
  // Keep the footer visible while the product viewport contracts with the window.
  // At its minimum, the first product image is still visible down to its centre.
  const minimumListHeight = lists.length ? Math.max(...minimumListHeights) : naturalListHeight;
  const availableListHeight = cartPreviewOverlay.clientHeight - 6 - 16 - headerHeight - footerHeight;
  const listHeight = Math.min(naturalListHeight, Math.max(minimumListHeight, availableListHeight));
  cartPreview.style.height = `${Math.ceil(headerHeight + listHeight + footerHeight)}px`;
  measure.remove();
}

function openCartPreview() {
  renderCartPreview();
  cartPreview.hidden = false;
  cartPreviewOverlay.hidden = false;
  cartPreviewOverlay.scrollTop = 0;
  document.body.classList.add('has-cart-preview');
  positionCartPreview();
  cartPreviewTrigger.setAttribute('aria-expanded', 'true');
}

function closeCartPreview(restoreFocus = false) {
  if (cartPreview.hidden) return;
  cartPreview.hidden = true;
  cartPreviewOverlay.hidden = true;
  document.body.classList.remove('has-cart-preview');
  cartPreviewTrigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) cartPreviewTrigger.focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

function renderTabs() {
  const cartTabs = carts.map((cart) => `
    <button class="cart-tab ${cart.id === 'main' ? 'primary' : 'extra'}${cart.id === activeCartId ? ' is-active' : ''}"
      type="button" role="tab" aria-selected="${cart.id === activeCartId}" data-cart-id="${cart.id}">
      ${esc(cart.name)}<sup>${cart.products.length}</sup>
    </button>`).join('');
  const add = !isRegistered || hasAdditional() ? '' : '<button class="cart-tab add" type="button" role="tab" data-action="add-cart">Добавить корзину</button>';
  const solutionTab = solutions.length ? `<span class="cart-tab-separator" aria-hidden="true">|</span>
    <button class="cart-tab solutions-tab${activeCartId === 'solutions' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${activeCartId === 'solutions'}" data-cart-id="solutions">Типовые решения<sup>${solutions.length}</sup></button>` : '';
  tabs.innerHTML = cartTabs + add + solutionTab;
}

function quantityValue(item) {
  return item.step < 1 ? `${Number(item.quantity.toFixed(3))} км` : String(item.quantity);
}

function honestSignTemplate(id) {
  return `<span class="honest-sign-wrap">
    <button class="honest-sign" type="button" aria-describedby="honest-tooltip-${id}"><img src="assets/honest-sign.svg" alt="">Честный знак</button>
    <span class="honest-tooltip" id="honest-tooltip-${id}" role="tooltip">
      Государственная маркировка<br>для проверки подлинности товаров. <a href="https://www.tinko.ru/marking/instructions/" target="_blank" rel="noopener">Подробнее</a><br><br>
      Кабели, <span class="tooltip-muted">ТН ВЭД:</span> 8517620002,<br><span class="tooltip-muted">ОКПД2:</span> 27.20.11.000
    </span>
  </span>`;
}

function priceTemplate(item, label = item.sale ? 'Распродажа' : 'Ваша цена') {
  const unitPrice = item[customerPriceKey()];
  return `<div class="price-column">
    <div class="current-price${isRegistered && item.sale ? ' sale' : ''}">
      <p class="price-label">${isRegistered ? label : 'Розничная цена'}</p>
      <p class="line-total">${priceMarkup(lineTotal(item))}</p>
      <p class="unit-price${item.quantity > 1 ? '' : ' is-empty'}">${item.quantity > 1 ? `${money(unitPrice)} / ${item.unit}` : '&nbsp;'}</p>
    </div>
    ${isRegistered ? `<div class="price-group retail-price"><p>Розница</p><p class="value">${money(item.retailPrice)} / ${item.unit}</p></div>` : ''}
  </div>`;
}

function productTemplate(item) {
  const atMinimum = item.quantity <= item.step + 0.0001;
  const moveLabel = activeCartId === 'main' ? 'В дополнительную корзину' : 'В основную корзину';
  const moveButton = hasAdditional() ? `
    <div class="transfer-control">
      <button class="action-button move-button${activeCartId === 'additional' ? ' is-return' : ''}" type="button" data-tooltip="${moveLabel}" aria-label="${moveLabel}"
        aria-haspopup="menu" aria-expanded="false" aria-controls="transfer-menu-${item.id}">
        <img src="assets/move-cart.svg" alt="">
      </button>
      <div class="transfer-menu" id="transfer-menu-${item.id}" role="menu" aria-label="${moveLabel}" hidden>
        <button type="button" role="menuitem" data-transfer-action="move">Переместить</button>
        <button type="button" role="menuitem" data-transfer-action="duplicate">Дублировать</button>
      </div>
    </div>` : '';
  const availability = item.step < 1
    ? `${esc(item.availability)}<small>Кратность продажи: 0.2 км</small>`
    : esc(item.availability);
  return `
    <article class="cart-item" data-id="${item.id}">
      <div class="item-main">
        <div class="product-visual">
          <img src="${item.image}" alt="${esc(item.title)}">
          <label class="product-check" aria-label="Выбрать ${esc(item.title)}">
            <input type="checkbox" ${item.selected ? 'checked' : ''}><span class="custom-check"><img src="assets/check-new.svg" alt=""></span>
          </label>
        </div>
        <div class="item-details">
          <div class="item-info">
            <a class="product-title" href="#">${esc(item.title)}</a>
            <div class="product-meta">
              <div class="meta-line"><span class="meta-label">Код:</span><button class="copy-code" type="button" data-code="${item.id}">${item.id}<img src="assets/copy.svg" alt="Копировать"></button></div>
              <div class="meta-line"><span class="meta-label">Производитель:</span><a class="manufacturer" href="#">${esc(item.manufacturer)}</a></div>
            </div>
            ${item.honestSign ? honestSignTemplate(item.id) : ''}
          </div>
          <div class="quantity-block">
            <div class="quantity-control">
              <button class="quantity-minus" type="button" aria-label="Уменьшить количество" ${atMinimum ? 'disabled' : ''}><img src="assets/${atMinimum ? 'minus-disabled' : 'minus'}.svg" alt=""></button>
              <label class="quantity-field${item.step < 1 ? ' is-cable' : ''}">
                <span class="sr-only">Количество товара</span>
                <input class="quantity-input" type="text" inputmode="decimal" value="${quantityValue(item)}" aria-label="Количество товара">
                ${item.step < 1 ? `<small>${Math.round(item.quantity * 1000)} м</small>` : ''}
              </label>
              <button class="quantity-plus" type="button" aria-label="Увеличить количество"><img src="assets/plus.svg" alt=""></button>
            </div>
            <p class="availability${item.stock ? ' in-stock' : ''}">${availability}</p>
          </div>
          ${priceTemplate(item)}
        </div>
      </div>
      <div class="item-footer">
        <p class="item-spec">Общий вес 0,1 кг; Объем ≈0,2 л; Д×В×Ш = 15×4,6×2,2 см</p>
        <div class="item-actions">
          <button class="action-button favorite-button" type="button" data-tooltip="${item.favorite ? 'Убрать из избранного' : 'В избранное'}" aria-label="${item.favorite ? 'Убрать из избранного' : 'В избранное'}" aria-pressed="${item.favorite}"><img src="assets/${item.favorite ? 'favorite-filled' : 'row-favorite'}.svg" alt=""></button>
          ${moveButton}
          <button class="action-button remove-button" type="button" data-tooltip="Удалить" aria-label="Удалить"><img src="assets/row-trash.svg" alt=""></button>
        </div>
      </div>
    </article>`;
}

function solutionTotal(solution, price = customerPriceKey()) {
  return roundMoney(solution.groups.reduce((total, group) => total + group.products.reduce((sum, item) => sum + lineTotal(item, price), 0), 0));
}

function metadataTemplate(item) {
  return `<div class="product-meta">
    <div class="meta-line"><span class="meta-label">Код:</span><button class="copy-code" type="button" data-code="${item.id}">${item.id}<img src="assets/copy.svg" alt="Копировать"></button></div>
    <div class="meta-line"><span class="meta-label">Производитель:</span><a class="manufacturer" href="#">${esc(item.manufacturer)}</a></div>
  </div>`;
}

function quantityControlTemplate(item, inputClass, disabled = false) {
  const minimum = item.minQuantity ?? 1;
  const atMinimum = item.quantity <= minimum + 0.00001;
  return `<div class="quantity-control">
    <button class="quantity-minus" type="button" aria-label="Уменьшить количество ${esc(item.title)}" ${atMinimum || disabled ? 'disabled' : ''}><img src="assets/${atMinimum || disabled ? 'minus-disabled' : 'minus'}.svg" alt=""></button>
    <label class="quantity-field${item.unit === 'км' ? ' is-cable' : ''}">
      <input class="${inputClass}" type="text" inputmode="decimal" aria-label="Количество ${esc(item.title)}" value="${quantityValue(item)}" ${disabled ? 'disabled' : ''}>
      ${item.unit === 'км' ? `<small>${Math.round(item.quantity * 1000)} м</small>` : ''}
    </label>
    <button class="quantity-plus" type="button" aria-label="Увеличить количество ${esc(item.title)}" ${disabled ? 'disabled' : ''}><img src="assets/plus.svg" alt=""></button>
  </div>`;
}

function solutionCardTemplate(solution) {
  const priced = { ...solution, yourPrice: solutionTotal(solution), retailPrice: solutionTotal(solution, 'retailPrice') };
  return `<article class="solution-card" data-solution-id="${solution.instanceId}">
    <div class="solution-card-content">
      <div class="solution-card-main">
        <div class="product-visual"><img src="${solution.image}" alt="${esc(solution.title)}"></div>
        <div class="solution-card-details">
          <div class="solution-info">
            <div class="solution-copy"><div><a class="product-title" href="#">${esc(solution.title)}</a><p class="product-description">${esc(solution.description)}</p></div>${metadataTemplate(solution)}</div>
            <button class="edit-solution-button" type="button"><img src="assets/edit-solution.svg" alt="">Изменить состав решения</button>
          </div>
          <span class="solution-quantity-lock" tabindex="0" aria-describedby="solution-quantity-tip-${solution.instanceId}">
            ${quantityControlTemplate(solution, 'solution-quantity-input', true)}
            <span class="solution-quantity-tooltip" id="solution-quantity-tip-${solution.instanceId}" role="tooltip">Чтобы добавить ещё одно решение, продублируйте его и оформите отдельную заявку.</span>
          </span>
          ${priceTemplate(priced, 'С учетом скидки')}
        </div>
      </div>
      <div class="item-footer"><p class="item-spec">Общий вес 0,1 кг; Объем ≈0,2 л; Д×В×Ш = 15×4,6×2,2 см</p>
        <div class="item-actions">
          <button class="action-button duplicate-solution" type="button" data-tooltip="Дублировать" aria-label="Дублировать решение"><img src="assets/duplicate-solution.svg" alt=""></button>
          <button class="action-button favorite-solution" type="button" data-tooltip="${solution.favorite ? 'Убрать из избранного' : 'В избранное'}" aria-label="В избранное" aria-pressed="${solution.favorite}"><img src="assets/${solution.favorite ? 'favorite-filled' : 'row-favorite'}.svg" alt=""></button>
          <button class="action-button delete-solution" type="button" data-tooltip="Удалить" aria-label="Удалить решение"><img src="assets/row-trash.svg" alt=""></button>
        </div>
      </div>
    </div>
    <button class="solution-checkout" type="button">Оформить заявку</button>
  </article>`;
}

function renderSolutions() {
  solutionsPanel.innerHTML = solutions.map(solutionCardTemplate).join('');
}

function componentTemplate(item) {
  return `<div class="item-main">
    <div class="product-visual"><img src="${item.image}" alt="${esc(item.title)}"></div>
    <div class="item-details">
      <div class="item-info"><div><a class="product-title" href="#">${esc(item.title)}</a><p class="product-description">${esc(item.description)}</p></div>${metadataTemplate(item)}${item.honestSign ? honestSignTemplate('component-' + item.id) : ''}</div>
      <div class="quantity-block">${quantityControlTemplate(item, 'component-quantity-input')}${item.minQuantity > 0 ? '<p class="availability in-stock">Обязательно</p>' : ''}${item.unit === 'км' ? `<p class="availability">Кратность продажи: ${item.step} км</p>` : ''}</div>
      ${priceTemplate(item)}
    </div>
  </div>`;
}

function getEditingSolution() {
  return solutions.find((solution) => solution.instanceId === editingSolutionId);
}

function renderSolutionFooter() {
  const solution = getEditingSolution();
  const footer = modalLayer.querySelector('.solution-modal-footer');
  if (!solution || !footer) return;
  footer.innerHTML = `<nav class="solution-group-links" aria-label="Разделы состава">${solution.groups.map((group, index) => `<button type="button" data-solution-group="${group.id}" class="${index === 0 ? 'is-active' : ''}">${esc(group.name)}: <span>${money(group.products.reduce((sum, item) => sum + lineTotal(item), 0))}</span></button>`).join('')}</nav>
    <div class="solution-modal-bottom"><p>Сумма итого: ${priceMarkup(solutionTotal(solution) * solution.quantity)}</p><div><button class="reset-solution" type="button">Сбросить</button><button class="submit-solution" type="button">Оформить заявку</button></div></div>`;
}

function openSolutionModal(instanceId) {
  const solution = solutions.find((entry) => entry.instanceId === instanceId);
  if (!solution) return;
  editingSolutionId = instanceId;
  modalLayer.classList.add('is-solution-modal');
  modalLayer.innerHTML = `<section class="solution-modal" role="dialog" aria-modal="true" aria-labelledby="solution-modal-title">
    <header class="solution-modal-header"><h2 id="solution-modal-title">Состав комплекта: ${esc(solution.title)}</h2><button class="modal-close" type="button" aria-label="Закрыть"><img src="assets/close.svg" alt=""></button></header>
    <div class="solution-modal-body">${solution.groups.map((group) => `<section class="solution-component-group" id="${group.id}"><h3>${esc(group.name)}</h3><div class="component-list">${group.products.map((item) => `<article class="component-row" data-component-id="${item.id}">${componentTemplate(item)}</article>`).join('')}</div></section>`).join('')}</div>
    <footer class="solution-modal-footer"></footer>
  </section>`;
  renderSolutionFooter();
  modalLayer.hidden = false;
  document.body.classList.add('has-modal');
  modalLayer.querySelector('.modal-close').focus();
}

function normalizeComponentQuantity(item, raw) {
  let value = Number.parseFloat(String(raw).replace(',', '.').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(value)) value = item.minQuantity;
  const units = Math.round(value / item.step);
  return Math.max(item.minQuantity, Math.min(item.unit === 'км' ? 100 : 999, Math.round(units * item.step * 1000) / 1000));
}

function updateComponentQuantity(input) {
  const row = input.closest('.component-row');
  const solution = getEditingSolution();
  const item = solution?.groups.flatMap((group) => group.products).find((entry) => entry.id === row?.dataset.componentId);
  if (!item) return;
  item.quantity = normalizeComponentQuantity(item, input.value);
  row.innerHTML = componentTemplate(item);
  renderSolutionFooter();
}

function renderSummary(cart) {
  const selected = cart.products.filter((item) => item.selected);
  const allSelected = selected.length === cart.products.length;
  const allTotal = cart.products.reduce((sum, item) => sum + lineTotal(item), 0);
  const selectedTotal = selected.reduce((sum, item) => sum + lineTotal(item), 0);
  const selectedRetail = selected.reduce((sum, item) => sum + lineTotal(item, 'retailPrice'), 0);
  const allRetail = cart.products.reduce((sum, item) => sum + lineTotal(item, 'retailPrice'), 0);
  const selectedBlock = allSelected ? `
    <div class="summary-line">
      <p class="summary-count">В корзине: <strong>${cart.products.length} ${plural(cart.products.length)}</strong></p>
    </div>
    <div class="summary-line">
      <p class="summary-label">На сумму:</p>
      <p class="summary-price">${priceMarkup(allTotal)}</p>
      ${isRegistered ? `<p class="summary-retail">${money(allRetail)}</p>` : ''}
    </div>` : `
    <div class="summary-line summary-muted">
      <p class="summary-count">В корзине: <strong>${cart.products.length} ${plural(cart.products.length)}</strong></p>
    </div>
    <div class="summary-line summary-muted">
      <p class="summary-label">На сумму:</p>
      <p class="summary-price summary-muted">${priceMarkup(allTotal)}</p>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-line">
      <p class="summary-count">Выбрано: <strong>${selected.length} ${plural(selected.length)}</strong></p>
    </div>
    <div class="summary-line">
      <p class="summary-label">На сумму:</p>
      <p class="summary-price">${priceMarkup(selectedTotal)}</p>
      ${isRegistered ? `<p class="summary-retail">${money(selectedRetail)}</p>` : ''}
    </div>`;
  summary.innerHTML = `${selectedBlock}
    ${selected.length ? '<p class="summary-metrics">Общий вес: <strong>70,3 кг.</strong>; Объем ≈<strong>263,9 л.</strong>;<br>Максимальный габарит: <strong>64,1 см.</strong></p>' : ''}
    <div class="checkout-wrap"><button class="checkout-button" type="button" ${selected.length ? '' : 'disabled'}>Оформить заявку</button></div>
    ${selected.length ? '<div class="summary-divider"></div><p class="summary-note">Скидки и сроки поставки будут дополнительно согласованы с Вами менеджером отдела продаж</p>' : ''}
    ${!isRegistered && selected.length ? `<div class="summary-divider"></div>${registrationOfferTemplate(selectedTotal, true)}` : ''}`;
}

function render() {
  closeTransferMenu();
  renderAccount();
  if (!isRegistered && !isAddingFlow && activeCartId === 'additional') activeCartId = 'main';
  if (activeCartId === 'solutions' && !solutions.length) activeCartId = 'main';
  renderCartPreview();
  catalogRoot.hidden = !isCatalogVisible;
  cartPage.hidden = isCatalogVisible;
  if (isAddingFlow) updateCatalogButtons();
  if (isCatalogVisible) {
    renderCatalog();
    document.title = 'Добавление в корзину — ТД ТИНКО';
    return;
  }
  document.title = ['guest', 'registered', 'add'].includes(requestedMode) ? 'Корзина — ТД ТИНКО' : 'Выбор пользователя — ТД ТИНКО';
  const isSolutions = activeCartId === 'solutions';
  solutionsPanel.hidden = !isSolutions;
  if (isSolutions) {
    renderTabs();
    additionalInfo.hidden = true;
    contentGrid.hidden = true;
    emptyState.hidden = true;
    renderSolutions();
    return;
  }
  const cart = getActiveCart();
  const isEmpty = cart.products.length === 0;
  renderTabs();
  additionalInfo.hidden = cart.id === 'main';
  contentGrid.hidden = isEmpty;
  emptyState.hidden = !isEmpty;
  if (isEmpty) return;
  itemsRoot.innerHTML = cart.products.map(productTemplate).join('');
  const selected = cart.products.filter((item) => item.selected);
  selectAll.checked = selected.length === cart.products.length;
  selectAll.indeterminate = selected.length > 0 && selected.length < cart.products.length;
  deleteSelected.disabled = selected.length === 0;
  renderSummary(cart);
}

function normalizeQuantity(item, raw) {
  const normalized = String(raw).trim().replace(',', '.').replace(/[^0-9.]/g, '');
  let value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) value = item.step;
  if (item.step < 1) {
    value = Math.round(value / item.step) * item.step;
    return Math.min(100, Math.max(item.step, Math.round(value * 10) / 10));
  }
  return Math.min(999, Math.max(1, Math.round(value)));
}

function applyQuantityInput(input) {
  const itemNode = input.closest('.cart-item');
  if (!itemNode) return;
  const item = getActiveCart().products.find((product) => product.id === Number(itemNode.dataset.id));
  if (!item) return;
  item.quantity = normalizeQuantity(item, input.value);
  render();
}

function openModal(type) {
  pendingAction = type;
  const extra = type === 'delete-cart';
  modalLayer.innerHTML = `
    <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head"><h2 id="modal-title">${extra ? 'Удалить дополнительную корзину?' : 'Удалить выбранные товары?'}</h2><button class="modal-close" type="button" aria-label="Закрыть"><img src="assets/close.svg" alt=""></button></div>
      <p class="modal-copy">${extra ? 'Вы точно хотите удалить выбранные товары?<br>Все собранные в эту корзину товары будут удалены<br>вместе с ней.' : 'Вы точно хотите удалить выбранные товары?<br>Отменить данное действие будет невозможно.'}</p>
      <div class="modal-actions"><button class="modal-cancel" type="button">Отменить</button><button class="modal-confirm" type="button">Да, удалить</button></div>
    </section>`;
  modalLayer.hidden = false;
  document.body.classList.add('has-modal');
  modalLayer.querySelector('.modal-cancel').focus();
}

function closeModal() {
  modalLayer.hidden = true;
  modalLayer.innerHTML = '';
  pendingAction = null;
  document.body.classList.remove('has-modal');
  modalLayer.classList.remove('is-solution-modal');
  if (editingSolutionId) {
    editingSolutionId = null;
    render();
  }
}

function removeAdditionalCart() {
  carts = carts.filter((cart) => cart.id !== 'additional');
  activeCartId = 'main';
  previewSectionId = 'main';
  render();
  showToast('Дополнительная корзина удалена');
}

function closeTransferMenu(restoreFocus = false) {
  const trigger = itemsRoot.querySelector('.move-button[aria-expanded="true"]');
  if (!trigger) return;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.closest('.transfer-control').querySelector('.transfer-menu').hidden = true;
  if (restoreFocus) trigger.focus();
}

function toggleTransferMenu(trigger) {
  const wasOpen = trigger.getAttribute('aria-expanded') === 'true';
  closeTransferMenu();
  if (wasOpen) return;
  const menu = trigger.closest('.transfer-control').querySelector('.transfer-menu');
  trigger.setAttribute('aria-expanded', 'true');
  menu.hidden = false;
  menu.classList.remove('opens-below');
  if (menu.getBoundingClientRect().top < 8) menu.classList.add('opens-below');
  menu.querySelector('[role="menuitem"]').focus();
}

function transferProduct(item, action) {
  const sourceCart = getActiveCart();
  const targetId = activeCartId === 'main' ? 'additional' : 'main';
  const targetCart = carts.find((cart) => cart.id === targetId);
  if (!targetCart) return;
  const existing = targetCart.products.find((product) => product.id === item.id);
  if (existing) {
    // Add complete sale units to avoid floating-point drift for cable lengths.
    const units = Math.round(existing.quantity / item.step) + Math.round(item.quantity / item.step);
    existing.quantity = Math.round(units * item.step * 10000) / 10000;
    existing.selected = true;
  } else {
    targetCart.products.push({ ...item, selected: true });
  }
  if (action === 'move') sourceCart.products = sourceCart.products.filter((product) => product.id !== item.id);
  render();
  showToast(action === 'move' ? 'Товар перемещён' : 'Товар продублирован');
}

tabs.addEventListener('click', (event) => {
  const cartTab = event.target.closest('[data-cart-id]');
  if (cartTab) {
    activeCartId = cartTab.dataset.cartId;
    previewSectionId = activeCartId;
    render();
    return;
  }
  if (event.target.closest('[data-action="add-cart"]')) {
    if (!isRegistered) return;
    carts.push({ id: 'additional', name: 'Дополнительная корзина', products: [] });
    activeCartId = 'additional';
    previewSectionId = 'additional';
    render();
  }
});

cartPreviewTrigger.addEventListener('click', (event) => {
  event.stopPropagation();
  if (cartPreview.hidden) openCartPreview(); else closeCartPreview();
});

cartPreviewClose.addEventListener('click', () => closeCartPreview(true));
cartPreviewOverlay.addEventListener('click', () => closeCartPreview(true));
window.addEventListener('resize', () => {
  if (!cartPreview.hidden) positionCartPreview();
});

cartPreview.addEventListener('click', (event) => {
  event.stopPropagation();
  if (event.target.closest('.registration-link')) {
    signIn();
    return;
  }
  const selector = event.target.closest('[data-preview-section]');
  if (selector) {
    previewSectionId = selector.dataset.previewSection;
    renderCartPreview();
    return;
  }
  const productRow = event.target.closest('.cart-preview-product');
  if (productRow && event.target.closest('.preview-edit-solution')) {
    const instanceId = productRow.dataset.previewItem;
    closeCartPreview();
    openSolutionModal(instanceId);
    return;
  }
  const copyButton = event.target.closest('.copy-code');
  if (copyButton) {
    navigator.clipboard?.writeText(copyButton.dataset.code).catch(() => {});
    showToast('Код скопирован');
    return;
  }
  const previewAction = event.target.closest('.preview-favorite,.preview-remove');
  if (productRow && previewAction) {
    const isSolution = productRow.dataset.previewKind === 'solutions';
    const item = isSolution
      ? solutions.find((entry) => entry.instanceId === productRow.dataset.previewItem)
      : carts.find((cart) => cart.id === previewSectionId)?.products.find((entry) => String(entry.id) === productRow.dataset.previewItem);
    if (!item) return;
    if (previewAction.classList.contains('preview-favorite')) {
      item.favorite = !item.favorite;
      render();
    } else if (isSolution) {
      solutions = solutions.filter((entry) => entry.instanceId !== item.instanceId);
      render();
      showToast('Решение удалено');
    } else {
      const cart = carts.find((entry) => entry.id === previewSectionId);
      cart.products = cart.products.filter((entry) => entry.id !== item.id);
      render();
      showToast('Товар удалён');
    }
    return;
  }
  if (event.target.closest('.cart-preview-catalog')) {
    closeCartPreview();
    if (isAddingFlow) { isCatalogVisible = true; render(); }
    else showToast('Открываем каталог');
    return;
  }
  const openButton = event.target.closest('[data-preview-open]');
  if (!openButton) return;
  activeCartId = openButton.dataset.previewOpen;
  previewSectionId = activeCartId;
  isCatalogVisible = false;
  render();
  closeCartPreview();
  if (isAddingFlow) window.scrollTo({ top: 0, behavior: 'instant' });
});

itemsRoot.addEventListener('click', async (event) => {
  const itemNode = event.target.closest('.cart-item');
  if (!itemNode) return;
  const cart = getActiveCart();
  const item = cart.products.find((product) => product.id === Number(itemNode.dataset.id));
  if (!item) return;

  if (event.target.closest('.quantity-minus')) {
    item.quantity = normalizeQuantity(item, item.quantity - item.step);
    render();
  } else if (event.target.closest('.quantity-plus')) {
    item.quantity = normalizeQuantity(item, item.quantity + item.step);
    render();
  } else if (event.target.closest('.favorite-button')) {
    item.favorite = !item.favorite;
    render();
  } else if (event.target.closest('[data-transfer-action]')) {
    transferProduct(item, event.target.closest('[data-transfer-action]').dataset.transferAction);
  } else if (event.target.closest('.move-button')) {
    toggleTransferMenu(event.target.closest('.move-button'));
  } else if (event.target.closest('.remove-button')) {
    cart.products = cart.products.filter((product) => product.id !== item.id);
    render();
    showToast('Товар удалён из корзины');
  } else if (event.target.closest('.copy-code')) {
    try { await navigator.clipboard.writeText(String(item.id)); } catch (_) { /* clipboard may be unavailable in file preview */ }
    showToast('Код скопирован');
  }
});

itemsRoot.addEventListener('change', (event) => {
  const itemNode = event.target.closest('.cart-item');
  if (!itemNode) return;
  const cart = getActiveCart();
  const item = cart.products.find((product) => product.id === Number(itemNode.dataset.id));
  if (!item) return;
  if (event.target.matches('.product-check input')) item.selected = event.target.checked;
  if (event.target.matches('.quantity-input')) {
    applyQuantityInput(event.target);
    return;
  }
  render();
});

itemsRoot.addEventListener('keydown', (event) => {
  if (event.target.matches('.quantity-input') && event.key === 'Enter') {
    event.preventDefault();
    applyQuantityInput(event.target);
  }
});

itemsRoot.addEventListener('focusout', (event) => {
  if (event.target.matches('.quantity-input')) applyQuantityInput(event.target);
});

selectAll.addEventListener('change', () => {
  getActiveCart().products.forEach((item) => { item.selected = selectAll.checked; });
  render();
});

document.querySelector('#print-button').addEventListener('click', () => window.print());
deleteSelected.addEventListener('click', () => {
  if (getActiveCart().products.some((item) => item.selected)) openModal('delete-selected');
});
document.querySelector('#delete-additional-cart').addEventListener('click', () => {
  const cart = getActiveCart();
  if (cart.id !== 'additional') return;
  if (cart.products.length) openModal('delete-cart'); else removeAdditionalCart();
});

solutionsPanel.addEventListener('click', async (event) => {
  const card = event.target.closest('.solution-card');
  const solution = solutions.find((entry) => entry.instanceId === card?.dataset.solutionId);
  if (!solution) return;
  if (event.target.closest('.edit-solution-button,.solution-checkout')) {
    openSolutionModal(solution.instanceId);
  } else if (event.target.closest('.quantity-minus,.quantity-plus')) {
    const delta = event.target.closest('.quantity-plus') ? 1 : -1;
    solution.quantity = Math.max(1, Math.min(999, solution.quantity + delta));
    renderSolutions();
  } else if (event.target.closest('.duplicate-solution')) {
    solutions.push({ ...structuredClone(solution), instanceId: `solution-${nextSolutionId++}` });
    render();
    showToast('Решение продублировано');
  } else if (event.target.closest('.favorite-solution')) {
    solution.favorite = !solution.favorite;
    renderSolutions();
  } else if (event.target.closest('.delete-solution')) {
    solutions = solutions.filter((entry) => entry.instanceId !== solution.instanceId);
    render();
    showToast('Решение удалено');
  } else if (event.target.closest('.copy-code')) {
    try { await navigator.clipboard.writeText(String(solution.id)); } catch (_) { /* local clipboard can be unavailable */ }
    showToast('Код скопирован');
  }
});

function updateSolutionQuantity(input) {
  const id = input.closest('.solution-card')?.dataset.solutionId;
  const solution = solutions.find((entry) => entry.instanceId === id);
  if (!solution) return;
  solution.quantity = normalizeQuantity(solution, input.value);
  renderSolutions();
}

solutionsPanel.addEventListener('change', (event) => {
  if (event.target.matches('.solution-quantity-input')) updateSolutionQuantity(event.target);
});
solutionsPanel.addEventListener('focusout', (event) => {
  if (event.target.matches('.solution-quantity-input')) updateSolutionQuantity(event.target);
});
solutionsPanel.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches('.solution-quantity-input')) {
    event.preventDefault();
    updateSolutionQuantity(event.target);
  }
});

modalLayer.addEventListener('click', (event) => {
  if (event.target === modalLayer || event.target.closest('.modal-close') || event.target.closest('.modal-cancel')) {
    closeModal();
    return;
  }
  if (editingSolutionId) {
    const solution = getEditingSolution();
    const row = event.target.closest('.component-row');
    const item = solution.groups.flatMap((group) => group.products).find((entry) => entry.id === row?.dataset.componentId);
    if (item && event.target.closest('.quantity-minus,.quantity-plus')) {
      const delta = event.target.closest('.quantity-plus') ? item.step : -item.step;
      item.quantity = normalizeComponentQuantity(item, item.quantity + delta);
      row.innerHTML = componentTemplate(item);
      renderSolutionFooter();
    } else if (event.target.closest('.reset-solution')) {
      solution.groups.forEach((group) => group.products.forEach((entry) => { entry.quantity = entry.initialQuantity; }));
      const scroll = modalLayer.querySelector('.solution-modal-body').scrollTop;
      openSolutionModal(solution.instanceId);
      modalLayer.querySelector('.solution-modal-body').scrollTop = scroll;
    } else if (event.target.closest('.submit-solution')) {
      closeModal();
      showToast('Состав решения сохранён. Заявка подготовлена');
    } else if (event.target.closest('[data-solution-group]')) {
      const button = event.target.closest('[data-solution-group]');
      modalLayer.querySelector(`#${button.dataset.solutionGroup}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
      modalLayer.querySelectorAll('[data-solution-group]').forEach((link) => link.classList.toggle('is-active', link === button));
    } else if (event.target.closest('.copy-code')) {
      const code = event.target.closest('.copy-code').dataset.code;
      navigator.clipboard?.writeText(code).catch(() => {});
      showToast('Код скопирован');
    }
    return;
  }
  if (!event.target.closest('.modal-confirm')) return;
  if (pendingAction === 'delete-selected') {
    const cart = getActiveCart();
    cart.products = cart.products.filter((item) => !item.selected);
    closeModal();
    render();
    showToast('Выбранные товары удалены');
  } else if (pendingAction === 'delete-cart') {
    closeModal();
    removeAdditionalCart();
  }
});

modalLayer.addEventListener('change', (event) => {
  if (event.target.matches('.component-quantity-input')) updateComponentQuantity(event.target);
});
modalLayer.addEventListener('focusout', (event) => {
  if (event.target.matches('.component-quantity-input')) updateComponentQuantity(event.target);
});
modalLayer.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches('.component-quantity-input')) {
    event.preventDefault();
    updateComponentQuantity(event.target);
  }
  if (event.key === 'Tab' && editingSolutionId) {
    const focusable = [...modalLayer.querySelectorAll('button:not(:disabled),input,a[href]')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

document.addEventListener('click', (event) => {
  if (event.target.closest('.registration-link')) signIn();
  if (!event.target.closest('.catalog-add-control')) closeCatalogMenus();
  if (!event.target.closest('.transfer-control')) closeTransferMenu();
  if (!event.target.closest('.cart-preview-control')) closeCartPreview();
});

accountButton.addEventListener('click', () => {
  if (!isRegistered) signIn();
  else showToast('Вы вошли в личный кабинет');
});

document.fonts.ready.then(() => {
  if (!cartPreview.hidden) positionCartPreview();
});

document.addEventListener('focusin', (event) => {
  if (!event.target.closest('.catalog-add-control')) closeCatalogMenus();
  if (!event.target.closest('.transfer-control')) closeTransferMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCatalogMenus(true);
  if (event.key === 'Escape') closeTransferMenu(true);
  if (event.key === 'Escape') closeCartPreview(true);
  const menu = event.target.closest('.transfer-menu');
  if (menu && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const options = [...menu.querySelectorAll('[role="menuitem"]')];
    const current = options.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  }
  if (event.key === 'Escape' && !modalLayer.hidden) closeModal();
});

const catalogProduct = {
  id: 319298, title: 'ДИП-34А-03 (ИП 212-34А)', manufacturer: 'ProxWay',
  description: 'Профессиональная тепловизионная IP-камера цилиндрическая',
  quantity: 1, step: 1, unit: 'шт', yourPrice: 13400, retailPrice: 13400,
  availability: 'В наличии 10 шт', stock: true, image: 'assets/catalog-product.png',
  favorite: false, selected: true,
};

function catalogCardTemplate(compact, chooseCart, index) {
  return `<article class="catalog-card${compact ? ' is-compact' : ''}" data-catalog-card="${index}" data-choose-cart="${chooseCart}">
    <div class="catalog-card-actions">
      <button type="button" aria-label="Добавить в сравнение" aria-pressed="false"><img src="assets/catalog-compare.svg" alt=""></button>
      <button type="button" aria-label="Добавить в избранное" aria-pressed="false"><img src="assets/catalog-favorite.svg" alt=""></button>
    </div>
    <div class="catalog-visual"><img class="catalog-product-image" src="${catalogProduct.image}" alt="${esc(catalogProduct.title)}"><div class="catalog-image-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="catalog-copy"><h2>${esc(catalogProduct.title)}</h2><p>${catalogProduct.description}</p>
      ${compact ? '' : `<div class="catalog-meta"><div><span>Код:</span> <button class="catalog-copy-code" type="button" aria-label="Скопировать код 319298">319298<img src="assets/catalog-copy.svg" alt=""></button></div><div><span>Производитель:</span> <a href="#">ProxWay</a></div></div>`}
      <div class="catalog-stock">${compact ? '' : '<img src="assets/catalog-stock.svg" alt="">'}В наличии 10 шт</div>
    </div>
    <div class="catalog-purchase">
      <div class="catalog-prices"><div><strong>13 400<small>,00 ₽/шт</small></strong><span>Розничная</span></div>${compact ? '' : '<div class="catalog-wholesale"><strong>12 400<small>,00 ₽/шт</small></strong><span>Оптовая</span></div>'}</div>
      <div class="catalog-purchase-controls"><div class="catalog-quantity"><button type="button" data-catalog-delta="-1" aria-label="Уменьшить количество" disabled><img src="assets/catalog-minus.svg" alt=""></button><input type="text" inputmode="numeric" value="1" aria-label="Количество товара"><button type="button" data-catalog-delta="1" aria-label="Увеличить количество"><img src="assets/catalog-plus.svg" alt=""></button></div>
      <div class="catalog-add-control"><button class="catalog-add-button" type="button"${chooseCart ? ` aria-haspopup="menu" aria-expanded="false" aria-controls="catalog-menu-${index}"` : ''} aria-label="В корзину"><span class="catalog-button-default"><img src="assets/catalog-basket.svg" alt="">${compact ? '' : '<span>В корзину</span>'}</span><span class="catalog-button-more"><img src="assets/catalog-add-more.svg" alt="">${compact ? '' : '<span>Добавить ещё</span>'}</span></button>
        ${chooseCart ? `<div id="catalog-menu-${index}" class="catalog-destination" role="menu" aria-label="В какую корзину добавить" hidden><p>Добавить в корзину</p><button type="button" role="menuitem" data-destination="main">Основная корзина</button><button type="button" role="menuitem" data-destination="additional">Дополнительная корзина</button></div>` : ''}
      </div></div>
      <div class="catalog-line-total">Итого: <strong>13 400 ₽</strong></div>
    </div>
  </article>`;
}

function renderCatalog() {
  if (catalogRoot.childElementCount) return;
  catalogRoot.innerHTML = `<section class="catalog-scenario"><h1>Одна корзина</h1><div class="catalog-card-pair">${catalogCardTemplate(false, false, 0)}${catalogCardTemplate(true, false, 1)}</div></section><section class="catalog-scenario"><h1>Есть дополнительная корзина</h1><div class="catalog-card-pair">${catalogCardTemplate(false, true, 2)}${catalogCardTemplate(true, true, 3)}</div></section>`;
  updateCatalogButtons();
}

function updateCatalogButtons() {
  const added = carts.some((cart) => cart.products.some((item) => item.id === catalogProduct.id));
  catalogRoot.querySelectorAll('.catalog-add-button').forEach((button) => {
    button.classList.toggle('is-added', added);
    button.setAttribute('aria-label', added ? 'Добавить ещё' : 'В корзину');
    const content = button.querySelector('.catalog-button-default');
    content.querySelector('img').src = `assets/catalog-${added ? 'check' : 'basket'}.svg`;
    const label = content.querySelector('span');
    if (label) label.textContent = added ? 'В корзине' : 'В корзину';
  });
}

function closeCatalogMenus(restoreFocus = false) {
  catalogRoot.querySelectorAll('.catalog-add-button[aria-expanded="true"]').forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.parentElement.querySelector('.catalog-destination').hidden = true;
    if (restoreFocus) trigger.focus();
  });
}

function updateCatalogQuantity(card, raw) {
  const quantity = Math.max(1, Math.min(999, Math.floor(Number(String(raw).replace(/\D/g, ''))) || 1));
  card.querySelector('.catalog-quantity input').value = quantity;
  card.querySelector('[data-catalog-delta="-1"]').disabled = quantity === 1;
  card.querySelector('[data-catalog-delta="-1"] img').src = quantity === 1 ? 'assets/catalog-minus.svg' : 'assets/minus.svg';
  card.querySelector('.catalog-line-total strong').textContent = `${new Intl.NumberFormat('ru-RU').format(quantity * catalogProduct.retailPrice)} ₽`;
  return quantity;
}

function animateCatalogAddition(card) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = card.getBoundingClientRect();
  const target = cartPreviewTrigger.querySelector('img').getBoundingClientRect();
  const ghost = card.cloneNode(true);
  ghost.classList.add('catalog-flying-card');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  ghost.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  Object.assign(ghost.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  document.body.append(ghost);
  const dx = target.left + target.width / 2 - rect.left - rect.width / 2;
  const dy = target.top + target.height / 2 - rect.top - rect.height / 2;
  const scale = Math.min(target.width / rect.width, target.height / rect.height);
  const animation = ghost.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: .5, offset: 0 },
    { transform: `translate(${dx * .13}px, ${dy * .22}px) scale(.88)`, opacity: .45, offset: .3 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: .1, offset: 1 },
  ], { duration: 850, easing: 'cubic-bezier(.4, 0, .2, 1)' });
  animation.finished.then(() => {
    ghost.remove();
    cartPreviewTrigger.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.13)' }, { transform: 'scale(1)' }], { duration: 260 });
  }).catch(() => ghost.remove());
}

function addCatalogProduct(card, destination) {
  closeCatalogMenus();
  let cart = carts.find((entry) => entry.id === destination);
  if (!cart) { cart = { id: 'additional', name: 'Дополнительная корзина', products: [] }; carts.push(cart); }
  const quantity = updateCatalogQuantity(card, card.querySelector('input').value);
  const existing = cart.products.find((item) => item.id === catalogProduct.id);
  if (existing) existing.quantity += quantity;
  else cart.products.push({ ...catalogProduct, quantity });
  previewSectionId = destination;
  // Update only the controls and preview, leaving the clicked card in place.
  renderCartPreview();
  updateCatalogButtons();
  animateCatalogAddition(card);
  toast.textContent = `Добавлено ${quantity} шт. — ${cart.name.toLowerCase()}`;
}

catalogRoot.addEventListener('click', (event) => {
  const card = event.target.closest('[data-catalog-card]');
  if (!card) return;
  const quantityButton = event.target.closest('[data-catalog-delta]');
  if (quantityButton) { updateCatalogQuantity(card, Number(card.querySelector('input').value) + Number(quantityButton.dataset.catalogDelta)); return; }
  const destination = event.target.closest('[data-destination]');
  if (destination) { addCatalogProduct(card, destination.dataset.destination); card.querySelector('.catalog-add-button').focus(); return; }
  const addButton = event.target.closest('.catalog-add-button');
  if (addButton) {
    if (card.dataset.chooseCart === 'false') { addCatalogProduct(card, 'main'); return; }
    const wasOpen = addButton.getAttribute('aria-expanded') === 'true';
    closeCatalogMenus();
    if (!wasOpen) {
      if (!carts.some((cart) => cart.id === 'additional')) {
        carts.push({ id: 'additional', name: 'Дополнительная корзина', products: [] });
        renderCartPreview();
      }
      const menu = card.querySelector('.catalog-destination');
      menu.hidden = false;
      menu.classList.remove('opens-above');
      addButton.setAttribute('aria-expanded', 'true');
      menu.classList.toggle('opens-above', menu.getBoundingClientRect().bottom > window.innerHeight - 12);
      menu.querySelector('button').focus();
    }
    return;
  }
  if (event.target.closest('.catalog-copy-code')) { navigator.clipboard?.writeText('319298').catch(() => {}); showToast('Код скопирован'); return; }
  const action = event.target.closest('.catalog-card-actions button');
  if (action) { const pressed = action.getAttribute('aria-pressed') !== 'true'; action.setAttribute('aria-pressed', String(pressed)); showToast(pressed ? 'Товар добавлен' : 'Товар удалён'); }
});
catalogRoot.addEventListener('change', (event) => {
  if (event.target.matches('.catalog-quantity input')) updateCatalogQuantity(event.target.closest('[data-catalog-card]'), event.target.value);
});
catalogRoot.addEventListener('keydown', (event) => {
  const menu = event.target.closest('.catalog-destination');
  if (menu && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const options = [...menu.querySelectorAll('button')];
    const current = options.indexOf(document.activeElement);
    options[event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
  }
  if (event.key === 'Enter' && event.target.matches('.catalog-quantity input')) { updateCatalogQuantity(event.target.closest('[data-catalog-card]'), event.target.value); event.target.blur(); }
});
document.querySelector('.catalog-button').addEventListener('click', () => {
  if (isAddingFlow) { closeCartPreview(); isCatalogVisible = true; render(); window.scrollTo({ top: 0, behavior: 'instant' }); }
});
emptyState.querySelector('button').addEventListener('click', () => {
  if (isAddingFlow) { isCatalogVisible = true; render(); window.scrollTo({ top: 0, behavior: 'instant' }); }
});

render();
