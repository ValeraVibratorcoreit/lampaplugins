(function() {
    'use strict';

    var youtube_api_key = 'AIzaSyAE8x5SuJS8dIEP3jkG25oK_Ro1AxePffE'; // <-- Вставьте ваш YouTube API ключ здесь

    function YouTubeComponent(object) {
        var component_self = this;
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer(object);
        var search_input;
        var root_element; // Добавляем переменную для корневого DOM-элемента

        this.create = function() {
            search_input = $(Lampa.Template.get('lampac_search_input', {title: Lampa.Lang.translate('youtube_search_placeholder')}));
            search_input.on('hover:enter', function() {
                Lampa.Native.showKeyboard({
                    value: search_input.find('input').val(),
                    head: Lampa.Lang.translate('youtube_search_placeholder'),
                    confirm: function(new_value) {
                        search_input.find('input').val(new_value);
                        component_self.search(new_value);
                    }
                });
            });

            files.appendHead(search_input);
            files.appendFiles(scroll.render());
            root_element = files.render(); // Сохраняем DOM-элемент
            // return true; // Можно ничего не возвращать или возвращать true
        };

        this.render = function() {
            return root_element; // Lampa будет вызывать этот метод для получения DOM-элемента компонента
        };

        this.start = function() {
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                right: function() {
                    Navigator.move('right');
                },
                left: function() {
                    if (Navigator.canmove('left')) {
                        Navigator.move('left');
                    } else {
                        Lampa.Controller.toggle('menu');
                    }
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        };

        this.search = function(query) {
            if (!query) return;

            Lampa.Loading.start();
            network.clear();

            var api_url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + encodeURIComponent(query) + '&type=video&key=' + youtube_api_key;

            network.fetch(api_url, function(data) {
                Lampa.Loading.stop();
                if (data.items) {
                    component_self.displayResults(data.items);
                } else {
                    Lampa.Noty.show(Lampa.Lang.translate('search_no_results'));
                }
            }, function() {
                Lampa.Loading.stop();
                Lampa.Noty.show(Lampa.Lang.translate('search_error'));
            });
        };

        this.displayResults = function(items) {
            scroll.clear();
            items.forEach(function(item) {
                var video_title = item.snippet.title;
                var video_thumbnail = item.snippet.thumbnails.medium.url;
                var video_id = item.id.videoId;

                var element = {
                    title: video_title,
                    img: video_thumbnail,
                    url: 'https://www.youtube.com/watch?v=' + video_id,
                    id: video_id
                };

                var html = Lampa.Template.get('lampac_youtube_item', element);

                html.on('hover:enter', function() {
                    component_self.playVideo(element);
                });
                scroll.append(html);
            });
            Lampa.Controller.enable('content');
        };

        this.playVideo = function(item) {
            Lampa.Player.play({
                title: item.title,
                url: item.url,
                is_youtube: true // Специальный флаг для Lampa, если потребуется
            });
        };

        this.pause = function() {};
        this.stop = function() {};
        this.destroy = function() {
            network.clear();
            files.destroy();
            scroll.destroy();
        };
    }

    function startPlugin() {
        var manifest = {
            type: 'youtube',
            version: '0.0.1',
            name: 'YouTube',
            description: 'Плагин для просмотра YouTube',
            component: 'youtube_plugin'
        };

        Lampa.Manifest.plugins[manifest.component] = manifest;
        Lampa.Component.add(manifest.component, YouTubeComponent);

        Lampa.Lang.add({
            youtube_title: {
                ru: 'YouTube',
                en: 'YouTube',
                uk: 'YouTube',
                zh: 'YouTube'
            },
            youtube_search_placeholder: {
                ru: 'Поиск YouTube',
                en: 'Search YouTube',
                uk: 'Пошук YouTube',
                zh: '搜索 YouTube'
            },
            search_no_results: {
                ru: 'Ничего не найдено',
                en: 'No results found',
                uk: 'Нічого не знайдено',
                zh: '未找到结果'
            },
            search_error: {
                ru: 'Ошибка поиска',
                en: 'Search error',
                uk: 'Помилка пошуку',
                zh: '搜索错误'
            }
        });

        Lampa.Template.add('lampac_search_input', '<div class="search-input"><input type="text" placeholder="{title}"></div>');
        Lampa.Template.add('lampac_youtube_item', `
            <div class="online-prestige online-prestige--full selector">
                <div class="online-prestige__img">
                    <img src="{img}" alt="">
                </div>
                <div class="online-prestige__body">
                    <div class="online-prestige__head">
                        <div class="online-prestige__title">{title}</div>
                    </div>
                </div>
            </div>
        `);

        function addYoutubeMenuItem() {
            var button = $("<li class=\"menu__item selector\" data-action=\"youtube_plugin\">\n                <div class=\"menu__ico\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-youtube\"><path d=\"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z\"/><path d=\"M10 15.25l5.19-3.5-5.19-3.5z\"/></svg>\n                </div>\n                <div class=\"menu__text\">" + Lampa.Lang.translate('youtube_title') + "</div>\n            </li>");

            button.on('hover:enter', function() {
                Lampa.Activity.push({
                    title: Lampa.Lang.translate('youtube_title'),
                    component: 'youtube_plugin',
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(button);
        }

        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') {
                addYoutubeMenuItem();
            }
        });
    }

    if (!window.youtube_plugin_init) {
        window.youtube_plugin_init = true;
        startPlugin();
    }
})();
