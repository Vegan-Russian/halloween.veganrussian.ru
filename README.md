[Деплой](https://seal-pavel.github.io/halloween.veganrussian.ru/), [макет](https://www.figma.com/file/C5DajjnIeP4ppVyPFMKqT5/VR-Halloween?node-id=100%3A572)

## Установка и сборка проекта

#### Установите внешние зависимости

```sh
$ npm install
```

#### Запустите сборщик

```sh
$ npm start
```

В результате создастся папка _dist_, в которой окажутся готовые для дальнейшего использования html-файлы.

### Macbook на чипе m1
Для установки node-sass на Mac с чипом M1, вы можете попробовать следующие шаги:

1. Установите Rosetta 2, если еще не установили. Откройте Терминал и выполните:
```sh
/usr/sbin/softwareupdate --install-rosetta
```

2. Откройте новый сеанс терминала с помощью Rosetta:
```sh
arch -x86_64 /usr/bin/env bash
```
Перейдите в ваш проект и установите node-sass:

```sh
npm install node-sass
```
Вернитесь в обычный терминал (не Rosetta) и попробуйте снова выполнить ваш проект.

## Структура

```
├── src/
│   ├── fonts/
│   ├── images/
│   ├── js/
│   ├── pug/
│   └── scss/
```

## Данные рецептов

Рецепты лежат статикой в репозитории, бэкенд и API для них не нужны:

- `src/data/recipes.json` — список рецептов: `id`, `slug`, `title`, `author`, `author_link`, `description`, `ingredients`, `tools`, `steps`, `category`, `year`, `place`, `published`.
- `src/images/recipes/<slug>.webp` — картинка рецепта (до 1500 px, для страницы рецепта), `<slug>-small.webp` — до 500 px, для карточек.

Из этих данных при сборке получается весь сайт:

- карточки на главной, сгруппированные по годам, — прямо в HTML;
- отдельная страница на каждый рецепт: `recipe-<slug>.html` (шаблон `src/pug/templates/recipe.pug`);
- `sitemap.xml`, `robots.txt` и `llms.txt`, разметка schema.org (`Recipe`, `CollectionPage`, хлебные крошки), title, description и Open Graph — всё в `build/seo.js`.

Чтобы добавить рецепт: положить две картинки, добавить объект в JSON (`slug` — уникальный, из него строится адрес страницы), выставить `published: true` и перезапустить `npm start` — список страниц собирается при старте. Победители определяются полем `place` (1–3), год — полем `year`.

Старые ссылки `recipe.html#<id>` и `past-competition.html` переадресуют на новые адреса, на несуществующие отвечает `404.html`.

npm run start команда для разработки локально.Страницу можно открыть в браузере по адресу http://localhost:3010, либо просто найти нужный файл в итоговой папке dist.
Занимает порт 3010, будьте внимательны при запуске, чтобы иные программы не занимали этот порт.
Для сборки production версии команда - npm run minify. Собирает файлы и кладет в dist папку.
Для проверки правильности js и scss файлов - команда npm run lint-prod
