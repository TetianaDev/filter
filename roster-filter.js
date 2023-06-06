(function($){
    $(document).ready(function() {

        let speakersBlock = $('.roaster_output');
        let seeMoreButton = $('.roster_see_more');

        let searchInputField = $('.roster_search_input');

        let currentUrl = window.location.href;
        let url = new URL(currentUrl);
        let baseURL = url.origin + url.pathname;

        let newGetParams = '';

        let filters = {
            'categories': $('.filtersCategory'),
            'roles': $('.filtersRoles'),
            'age': $('.filtersAge'),
            'followers': $('.filtersFollowers'),
            'gender': $('.filtersGender'),
            'nationality': $('.filtersNationality')
        };

        if($('#roasterFilter').length) {
            // console.log(true);

            if(searchInputField.val() && searchInputField.val().length !== 0) {
                $('.roster_search_form').removeClass('d-none');
                $('.roster_open_search').addClass('d-none');
            }

            // Load artist before filters apply
            submitFilters();

            // Open selected filters by click
            $.each(filters, function(key, filter) {
                $('.roster_' + key + '_open').on('click', function (e) {
                    if (key !== 'roles' || !$(this).hasClass('rolesDisabled')) {
                        $('.hide_filters').slideUp();
                        filter.slideDown();
                    }
                });
            });

            // Alphabet letters
            $('.filter-letter_item').on('click', function(e) {
                $('.filter-letter_item').removeClass('active_letter');
                $(this).addClass('active_letter');

                submitFilters();
            })

            // Close button
            $('.roster_close_button').on('click', function(e) {
                $(this).parent().parent().slideUp();
            })

            // Filters form submit
            $('#roasterFilter').on('submit', function (e) {
                e.preventDefault();

                submitFilters();
            })

            // Remove selected filters
            $(document).on('click', '.roster_remove_selected', function(e) {
                let valueToRemove = $(this).data('filter-value');

                let filterName = $(this).data('filter-name');
                if(filterName === 'categories') {
                    $('input[data-parent-category="' + valueToRemove + '"]').prop('checked', false);
                }

                $('input[value="' + valueToRemove + '"]').prop('checked', false);
                $('.booking-nd__filter-block').remove();

                submitFilters();
            })

            // See more functional
            seeMoreButton.on('click', function(e) {
                e.preventDefault();

                let currentPage = $(this).attr('data-page_number');
                let nextPage = parseInt(currentPage) + 1

                $(this).attr('data-page_number', nextPage);

                submitFilters(nextPage, true);
            })

            // Open search input
            $('.roster_open_search').on('click', function(e) {
                $(this).addClass('d-none');
                $('.roster_search_form').removeClass('d-none');
            })

            // Search input handler
            $('.roster_search_form').on('submit', function(e) {
                e.preventDefault();
                submitFilters();
            })

            // Clear and close search field
            $('.roster_close_search').on('click', function(e) {
                searchInputField.val('');
                $('.roster_search_form').addClass('d-none');
                $('.roster_open_search').removeClass('d-none');
            })

            // Clear filter functional
            $.each(filters, function(key, filter) {
                $('.clear_' + key).on('click', function (e) {

                    $('input[data-filter-name="' + key + '"]').prop('checked', false);

                    if (key === 'categories') {
                        $('input[data-filter-name="roles"]').prop('checked', false);
                    }

                    if (key === 'followers') {
                        $('input[data-filter-name="followersInstagram"]').prop('checked', false);
                        $('input[data-filter-name="followersTiktok"]').prop('checked', false);
                        $('input[data-filter-name="followersFb"]').prop('checked', false);
                    }
                });
            });
        }

        // Function for submitting filters
        function submitFilters(page = 1, isPagination = false) {
            $('.hide_filters').slideUp();
            $('.js-filters-block').html('');
            seeMoreButton.addClass('d-none');

            if(isPagination) {
                $('.roster_loading_bottom').removeClass('d-none');
            } else {
                $('.roster_loading').removeClass('d-none');
            }

            let activeLetter = $('.active_letter').data('filter-letter');
            let searchQuery = $('.roster_search_input').val();

            let args = {
                letter: activeLetter,
                search_query: searchQuery,
                categories: [],
                roles: [],
                age: [],
                followersInstagram: [],
                followersTiktok: [],
                followersFb: [],
                gender: [],
                nationality: []
            };

            let allInputs = $('#roasterFilter').find('input');

            allInputs.each(function(e) {
                let isChecked = $(this).prop('checked');

                if(isChecked) {
                    let filterName = $(this).data('filter-name');
                    let filterValue = $(this).attr('value');
                    let filterLabel = $(this).data('label')

                    $('.js-filters-block').append(`<div class="booking-nd__filter-block"><span>${filterLabel}</span><button data-filter-name="${filterName}"  data-filter-value="${filterValue}" class="booking-nd__remove-filter-button roster_remove_selected"></button> </div>`);

                    if(newGetParams === '') {
                        newGetParams = '?' + filterName + '=' + filterValue;
                    } else {
                        newGetParams += '&' + filterName + '=' + filterValue;
                    }

                    switch (filterName) {
                        case 'categories':
                            args.categories.push(filterValue);
                            break;
                        case 'roles':
                            args.roles.push(filterValue);
                            break;
                        case 'age':
                            args.age.push(filterValue);
                            break;
                        case 'followersInstagram':
                            args.followersInstagram.push(filterValue)
                            break;
                        case 'followersTiktok':
                            args.followersTiktok.push(filterValue)
                            break;
                        case 'followersFb':
                            args.followersFb.push(filterValue)
                            break;
                        case 'gender':
                            args.gender.push(filterValue);
                            break;
                        case 'nationality':
                            args.nationality.push(filterValue);
                            break;
                        default:
                            break;
                    }
                }
            })

            // Clear previous artists if it's first page
            if(page === 1) {
                speakersBlock.html('');
            }

            // Manipulations with URL
            Object.keys(args).forEach(key => {
                if (args[key] === null || args[key] === '' || (Array.isArray(args[key]) && args[key].length === 0)) {
                    delete args[key];
                }
            });

            let queryString = toQueryString(args);
            rewriteURL(queryString);

            // Update category and roles counters
            if(args.hasOwnProperty('categories')) {
                $('.roster_categories_count').html(` (${args.categories.length})`);
            } else {
                $('.roster_categories_count').html(' (0)');
            }

            if(args.hasOwnProperty('roles')) {
                $('.roster_roles_count').html(` (${args.roles.length})`);
            } else {
                $('.roster_roles_count').html(' (0)');
            }

            // AJAX call to get artists
            $.ajax({
                type: 'POST',
                url: rosterFilterOptions.ajaxurl,
                data: {
                    'action': 'roster_filter',
                    'query': args,
                    'page' : page
                },
                success: (function(response) {
                    // Clear previous artists if it's first page
                    if(page === 1) {
                        speakersBlock.html('');
                    }

                    $('.roster_loading').addClass('d-none');
                    $('.roster_loading_bottom').addClass('d-none');

                    if(response.success === true) {
                        $('.roster_roles_output').html(response.data.roles_output);

                        // Make roles active if they exist
                        if ($('.roster_roles_output').children().length > 0) {
                            $('.roster_roles_open').removeClass('rolesDisabled');
                        } else {
                            $('.roster_roles_open').addClass('rolesDisabled');
                        }

                        let posts = response.data.posts;
                        let maxNumPages = parseInt(response.data.max_num_pages);
                        let currentPage = parseInt(response.data.current_page);

                        if(currentPage >= maxNumPages) {
                            seeMoreButton.addClass('d-none');
                        } else {
                            seeMoreButton.removeClass('d-none');
                        }

                        for (let post of posts) {
                            let speaker_data = {
                                filter_class: 'filter_class',
                                featured_image: post.thumbnail,
                                title: post.title,
                                permalink: post.permalink,
                                ID: post.id
                            }

                            let shortlistClass = 'artist_roster_shortlist_add add';
                            if(post.is_in_shortlist) {
                                shortlistClass = 'artist_roster_shortlist_remove remove';
                            }

                            if(typeof shortlistArtistDivND === 'function') {
                                speakersBlock.append(shortlistArtistDivND(speaker_data, shortlistClass, '', post.category_to_display))
                            }

                        }
                    } else {
                        speakersBlock.append('<div class="booking-nd__not-found">Results not found</div>');
                    }
                })
            })
        }

        function toQueryString(obj) {
            return '?' + Object.keys(obj).map(function(key) {
                if(Array.isArray(obj[key])) {
                    return key + '=' + obj[key].join(';');
                } else {
                    return key + '=' + obj[key];
                }
            }).join('&');
        }

        // Rewrite URL function
        function rewriteURL(newGetParams) {
            let newURL = baseURL + newGetParams;
            window.history.pushState({ path: newURL }, '', newURL);
        }
    })
})(jQuery);