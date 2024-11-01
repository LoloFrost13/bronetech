
window.addEventListener('scroll', function() {
    var header = document.querySelector('header');
    if (window.scrollY > 50) { 
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});
window.addEventListener('scroll', function() {
    var indicator = document.querySelector('.scroll-indicator');
    var scrollTop = window.scrollY;
    var documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollPercentage = (scrollTop / documentHeight) * 100;
    indicator.style.width = scrollPercentage + '%';
});

const menuIcon = document.querySelector('.menu-icon');
const menu = document.querySelector('.menu');


menuIcon.addEventListener('mouseenter', function() {
    menu.classList.add('active');
});
menuIcon.addEventListener('mouseleave', function() {
    menu.classList.remove('active');
});
menu.addEventListener('mouseenter', function() {
    menu.classList.add('active');
});
menu.addEventListener('mouseleave', function() {
    menu.classList.remove('active');
});


menuIcon.addEventListener('click', function() {
    menu.classList.toggle('active');
});


window.addEventListener('scroll', function() {
    menu.classList.remove('active');
});


document.addEventListener('click', function(event) {

    if (!menu.contains(event.target) && !menuIcon.contains(event.target)) {
        menu.classList.remove('active');
    }
});
document.addEventListener("DOMContentLoaded", function() {
    const features = document.querySelectorAll(".feature");
    window.addEventListener("scroll", function() {
        features.forEach(feature => {
            const rect = feature.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                feature.classList.add("visible");
            }
        });
    });
});




document.getElementById('cart-icon').addEventListener('click', () => {
    window.location.href = 'cart.html';
});



document.addEventListener("DOMContentLoaded", () => {
    const backgroundPattern = document.querySelector('.background-pattern');
    const icons = ['images/1.svg', 'images/2.svg', 'images/3.svg', 'images/4.svg', 'images/logo.svg'];
    const totalIcons = 200;

    for (let i = 0; i < totalIcons; i++) {
        const icon = document.createElement('img');
        icon.src = icons[Math.floor(Math.random() * icons.length)];
        icon.classList.add('background-icon');
        backgroundPattern.appendChild(icon);
    }
});






fetch('/api/products')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        return response.json();
    })
    .then(products => {

        const newProducts = products.filter(product => product.is_new === 1);

        if (newProducts.length === 0) {
            throw new Error('Новинок нет');
        }


        const randomNewProducts = newProducts
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

        const newArrivalContainer = document.querySelector('.catalog-grid-new');
        newArrivalContainer.innerHTML = '';
        
        randomNewProducts.forEach(product => {

            const productWrapper = document.createElement('div');
            productWrapper.classList.add('catalog-item-wrapper');


            const productCard = document.createElement('a');
            productCard.classList.add('catalog-card-new');
            productCard.href = `product.html?product=${product.id}`;
            productCard.innerHTML = `
            
                <img src="${product.main_image}" alt="${product.name}">
                <div class="new-badge">
                    <i class="fas fa-star"></i> NEW
                </div>
                <p>${product.name}</p>
                <span>${product.price} </span> <!-- Добавляем ₽ для цены -->
            `;
        

            productWrapper.appendChild(productCard);
            newArrivalContainer.appendChild(productWrapper);
        });
    })
    .catch(error => console.error('Ошибка при загрузке новинок:', error));


document.addEventListener("DOMContentLoaded", () => {
    const cartIcon = document.getElementById("cart-icon");

    if (cartIcon) {
        cartIcon.addEventListener("click", () => {
            window.location.href = "cart.html";
        });
    }
});


fetch('/api/products')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        return response.json();
    })
    .then(products => {

        const BestProducts = products.filter(product => product.is_bestseller === 1);

        if (BestProducts.length === 0) {
            throw new Error('Популярных товаров нет');
        }


        const randomBestProducts = BestProducts
            .sort(() => 0.5 - Math.random())
            .slice(0, 6);

        const bestProductsContainer = document.querySelector('.catalog-grid-best');
        bestProductsContainer.innerHTML = '';
        
        randomBestProducts.forEach(product => {

            const productWrapper = document.createElement('div');
            productWrapper.classList.add('catalog-item-wrapper');


            const productCard = document.createElement('a');
            productCard.classList.add('catalog-card-best');
            productCard.href = `product.html?product=${product.id}`;
            productCard.innerHTML = `
                <img src="${product.main_image}" alt="${product.name}">
                <div class="best-badge">
                    <i class="fas fa-star"></i> BEST
                </div>
                <p>${product.name}</p>
                <span>${product.price}</span>
            `;

            productWrapper.appendChild(productCard);
            bestProductsContainer.appendChild(productWrapper);
        });
    })
    .catch(error => console.error('Ошибка при загрузке популярных товаров:', error));



    
    
window.addEventListener('scroll', () => {
    const locationSection = document.querySelector('.location');
    const rect = locationSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
        locationSection.classList.add('in-view');
    }
});





document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
});



let allProducts = [];


const params = new URLSearchParams(window.location.search);
const category = params.get('category') || 'all';
const categoryTitle = {
    'zhilety': 'Жилеты',
    'moduli': 'Дополнительные модули защиты',
    'plity': 'Бронеплиты',
    'ballistic': 'Баллистическая защита',
    'shlemy': 'Баллистические шлемы',
    'poyasa': 'Тактические пояса',
    'podsumki': 'Подсумки',
    'ryukzaki': 'Рюкзаки и сумки',
    'naushniki': 'Активные наушники',
    'medicina': 'Тактическая медицина',
    'obuv': 'Обувь',
    'odezhda': 'Одежда',
    'all': 'Каталог товаров'
};
document.getElementById('category-title').textContent = categoryTitle[category] || 'Каталог товаров';


function loadProducts() {
    fetch(`/api/products?category=${category}`)
        .then(response => response.json())
        .then(products => {
            allProducts = products;
            displayProducts(allProducts);
        })
        .catch(error => console.error('Ошибка загрузки товаров:', error));
}



























const productGrid = document.querySelector('.karti-catolo-grid');


function displayProducts(products) {
    const productGrid = document.querySelector('.karti-catolo-grid');
    productGrid.innerHTML = '';

    products.forEach(product => {

        const productCard = document.createElement('div');
        productCard.className = 'karti-catolo';
        productCard.style.cursor = 'pointer';


        productCard.innerHTML = `
            <!-- Контейнер для изображения и бейджей -->
            <div class="karti-catolo-badge-container">
                ${product.is_bestseller ? '<div class="karti-catolo-best-badge">BEST</div>' : ''}
                ${product.is_new ? '<div class="karti-catolo-new-badge">NEW</div>' : ''}
            </div>
            <div class="karti-catolo-image-container">
                <img src="${product.main_image}" alt="${product.name}">
            </div>
        
            <!-- Контейнер для информации о товаре -->
            <div class="karti-catolo-info">
                <p class="product-name">${product.name}</p>
            </div>
        
            <!-- Контейнер для цены и кнопки внизу карточки -->
            <div class="karti-catolo-footer">
                <p class="price">
                    <span style="text-decoration: line-through;">${product.price} ₽</span>&nbsp;${product.price - product.discount} ₽
                </p>
                <div class="karti-catolo-button-container">
                    <a href="product.html?product=${product.id}" class="karti-catolo-btn more-details">Подробнее</a>
                </div>
            </div>
        `;


        productCard.addEventListener('click', () => {
            window.location.href = `product.html?product=${product.id}`;
        });


        const moreDetailsBtn = productCard.querySelector('.more-details');
        if (moreDetailsBtn) {
            moreDetailsBtn.addEventListener('click', (event) => {
                event.stopPropagation();

            });
        }


        productGrid.appendChild(productCard);
    });
}



document.getElementById('search-bar').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
});



document.getElementById('search-bar').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
});


function applyFiltersAndSort() {
    let filteredProducts = [...allProducts];

    const isNew = document.querySelector('#filter-new').checked;
    const isBestseller = document.querySelector('#filter-bestseller').checked;

    if (isNew) {
        filteredProducts = filteredProducts.filter(product => product.is_new);
    }
    if (isBestseller) {
        filteredProducts = filteredProducts.filter(product => product.is_bestseller);
    }


    const selectedOption = document.querySelector('.custom-select .select-trigger span').textContent;
    if (selectedOption === 'Цена: По возрастанию') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (selectedOption === 'Цена: По убыванию') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (selectedOption === 'По популярности') {
        filteredProducts.sort((a, b) => b.popularity - a.popularity);
    }

    displayProducts(filteredProducts);
}


document.getElementById('apply-filters').addEventListener('click', applyFiltersAndSort);


document.querySelectorAll('.custom-select .option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelector('.custom-select .select-trigger span').textContent = this.textContent;
        applyFiltersAndSort();
    });
});

window.addEventListener('scroll', () => {
    const backToTopBtn = document.getElementById('back-to-top');
    backToTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
});
document.getElementById('back-to-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});




document.addEventListener('DOMContentLoaded', () => {
    const catalogLink = document.getElementById('catalog-link');
    
    catalogLink.addEventListener('click', (event) => {
        event.preventDefault();

        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {

            document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
        } else {

            window.location.href = '/index.html#catalog';
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {

    function updateTitle() {

        const baseTitle = `Каталог ${categoryName} | БронеТeк`;
        let titleParts = [];


        const filterNew = document.getElementById('filter-new').checked;
        const filterBestseller = document.getElementById('filter-bestseller').checked;

        if (filterNew) {
            titleParts.push("Новинки");
        }
        if (filterBestseller) {
            titleParts.push("Бестселлеры");
        }


        const sortTrigger = document.querySelector('.custom-select .select-trigger span');
        const currentSort = sortTrigger ? sortTrigger.textContent : "По популярности";
        if (currentSort && currentSort !== "По популярности") {
            titleParts.push(currentSort);
        }

        const searchQuery = document.getElementById('search-bar').value.trim();
        if (searchQuery) {
            titleParts.unshift(`Поиск: ${searchQuery}`);
        }


        let finalTitle = "";
        if (titleParts.length > 0) {
            finalTitle = `${titleParts.join(' - ')} - ${baseTitle}`;
        } else {
            finalTitle = baseTitle;
        }

        document.title = finalTitle;
    }


    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || 'all';
    const categoryTitle = {
        'zhilety': 'Жилеты',
        'moduli': 'Дополнительные модули защиты',
        'plity': 'Бронеплиты',
        'ballistic': 'Баллистическая защита',
        'shlemy': 'Баллистические шлемы',
        'poyasa': 'Тактические пояса',
        'podsumki': 'Подсумки',
        'ryukzaki': 'Рюкзаки и сумки',
        'naushniki': 'Активные наушники',
        'medicina': 'Тактическая медицина',
        'obuv': 'Обувь',
        'odezhda': 'Одежда',
        'all': 'Каталог товаров'
    };
    const categoryName = categoryTitle[category] || 'Каталог товаров';
    document.getElementById('category-title').textContent = categoryName;


    updateTitle();


    document.getElementById('filter-new').addEventListener('change', updateTitle);
    document.getElementById('filter-bestseller').addEventListener('change', updateTitle);


    const sortOptions = document.querySelectorAll('.custom-select .option');
    sortOptions.forEach(option => {
        option.addEventListener('click', () => {

            const selectTrigger = document.querySelector('.custom-select .select-trigger span');
            if (selectTrigger) {
                selectTrigger.textContent = option.textContent;
            }

            document.querySelector('.custom-select .options').classList.remove('active');

            updateTitle();
        });
    });
});



        const searchBar = document.getElementById('search-bar');
        searchBar.addEventListener('input', updateTitle);
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();

                updateTitle();
            }
        });


        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                document.querySelector('.custom-select .options').classList.remove('active');
            }
        });


