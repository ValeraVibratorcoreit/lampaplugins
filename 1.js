(function() {
    'use strict';

    var youtube_api_key = 'AIzaSyAE8x5SuJS8dIEP3jkG25oK_Ro1AxePffE'; // <-- Вставьте ваш YouTube API ключ здесь

    function YouTubeComponent(object) {
        var component_self = this;
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer(object);
        var search_input;
        var root_element;
        var filter = new Lampa.Filter(object); // Добавляем Lampa.Filter

        this.create = function() {
            // Удаляем создание search_input, так как Lampa.Filter предоставит свой
            filter.onSearch = function(value) {
                component_self.search(value);
            };

            filter.onBack = function() {
                Lampa.Activity.backward();
            };

            files.appendHead(filter.render()); // Используем filter.render() для заголовка
            files.appendFiles(scroll.render());
            root_element = files.render();

            if (object.search) {
                component_self.search(object.search);
            }

            this.loading(true); // Показываем загрузку при создании
        };

        this.render = function() {
            return root_element;
        };

        this.start = function() {
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(filter.render().find('.filter--search').find('input')[0], scroll.render()); // Фокус на поле поиска в Lampa.Filter
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

        this.loading = function(status) {
            if (status) this.activity.loader(true);
            else {
                this.activity.loader(false);
                this.activity.toggle();
            }
        };

        this.reset = function() {
            scroll.clear();
            scroll.append(Lampa.Template.get('lampac_content_loading'));
            this.loading(true);
        };

        this.empty = function(msg) {
            var html = Lampa.Template.get('lampac_does_not_answer', {});
            html.find('.online-empty__buttons').remove();
            html.find('.online-empty__title').text(Lampa.Lang.translate('search_no_results'));
            html.find('.online-empty__time').text(msg || Lampa.Lang.translate('empty_text'));

            scroll.clear();
            scroll.append(html);

            this.loading(false);
        };

        this.search = function(query) {
            if (!query) {
                this.empty(Lampa.Lang.translate('youtube_search_placeholder')); // Показываем сообщение, если запрос пуст
                return;
            }

            component_self.reset(); // Сбрасываем и показываем загрузку

            var api_url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + encodeURIComponent(query) + '&type=video&key=' + youtube_api_key;

            network.fetch(api_url, function(data) {
                component_self.loading(false); // Останавливаем загрузку после получения данных
                if (data.items && data.items.length) {
                    component_self.displayResults(data.items);
                } else {
                    component_self.empty();
                }
            }, function() {
                component_self.empty(Lampa.Lang.translate('search_error'));
            });
        };

        this.displayResults = function(items) {
            scroll.clear(); // Очищаем старые результаты

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
                }).on('hover:focus', function(e) {
                    // Обновляем фокус для навигации по результатам
                    Lampa.Controller.collectionFocus(e.target, scroll.render());
                });
                scroll.append(html);
            });
            Lampa.Controller.enable('content');
        };

        this.playVideo = function(item) {
            Lampa.Player.play({
                title: item.title,
                url: item.url,
                is_youtube: true
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
            },
            empty_text: {
                ru: 'Поиск не дал результатов',
                uk: 'Пошук не дав результатів',
                en: 'Search did not return any results',
                zh: '搜索未返回任何结果'
            },
            empty_title_two: {
                ru: 'Здесь пусто',
                uk: 'Тут порожньо',
                en: 'Empty here',
                zh: '这里是空的'
            },
            cancel: {
                ru: 'Отмена',
                uk: 'Скасувати',
                en: 'Cancel',
                zh: '取消'
            },
            lampac_change_balanser: {
                ru: 'Изменить источник',
                uk: 'Змінити джерело',
                en: 'Change source',
                zh: '更改来源'
            },
            lampac_balanser_dont_work: {
                ru: 'Поиск не дал результатов',
                uk: 'Пошук не дав результатів',
                en: 'Search did not return any results',
                zh: '搜索未返回任何结果'
            },
            lampac_balanser_timeout: {
                ru: 'Источник будет переключен автоматически через <span class="timeout">10</span> секунд.',
                uk: 'Джерело буде автоматично переключено через <span class="timeout">10</span> секунд.',
                en: 'The source will be switched automatically after <span class="timeout">10</span> seconds.',
                zh: '来源将在<span class="timeout">10</span>秒内自动切换。'
            }
        });

        Lampa.Template.add('lampac_css', "\n        <style>\n        @charset \'UTF-8\';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:\'\';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:\' ● \';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n        </style>\n    ");
        Lampa.Template.add('lampac_search_input', '<div class="search-input"><input type="text" placeholder="{title}"></div>');
        Lampa.Template.add('lampac_prestige_full', `
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
                // Это нужно, чтобы шаблоны были доступны до первого использования
                resetTemplates();
                $('body').append(Lampa.Template.get('lampac_css', {}, true));
                addYoutubeMenuItem();
            }
        });
    }

    if (!window.youtube_plugin_init) {
        window.youtube_plugin_init = true;
        startPlugin();
        resetTemplates(); // Также вызываем здесь, если плагин загружается раньше события app:ready
        $('body').append(Lampa.Template.get('lampac_css', {}, true)); // И здесь
    }
})();
