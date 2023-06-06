<?php add_action( 'wp_ajax_nopriv_roster_filter', 'roster_filter' );
add_action( 'wp_ajax_roster_filter', 'roster_filter' );
    function roster_filter() {
        global $wpdb;
        $query = $_POST['query'];

        $categories = $query['categories'];
        $roles = $query['roles'];
        $age = $query['age'];
        $followersInstagram = $query['followersInstagram'];
        $followersTiktok = $query['followersTiktok'];
        $followersFb = $query['followersFb'];
        $gender = $query['gender'];
        $nationality = $query['nationality'];
        $search_query = $query['search_query'];
        $letter = $query['letter'];
        $page = intval($_POST['page']);

        $roles_output = '';

        $args = [
            'post_type' => 'artist',
            'post_status' => 'publish',
            'posts_per_page' => 12,
            'paged' =>  $page,
            'orderby' => 'title',
            'order' => 'ASC',
            'meta_query' => [
                'relation' => 'AND',
            ],
            'tax_query' => [
                'relation' => 'AND',
                [
                    'taxonomy' => 'talenttype',
                    'field'    => 'slug',
                    'terms'    => 'talent-roster',
                ],
                [
                    'relation' => 'OR',
                ]
            ]
        ];

        // Get post IDs based on selected letter and search phrase
        if ($letter == '0-9') {
            // Match numbers and non-English characters.
            $titles = $wpdb->get_col( $wpdb->prepare( "
                SELECT ID FROM $wpdb->posts
                WHERE (post_title REGEXP '^[0-9]' OR post_title REGEXP '^[^A-Za-z]')
                AND post_title LIKE '%%%s%%'
                AND post_type = 'artist'
                AND post_status = 'publish'
            ", $search_query ) );
        } else {
            // Match the chosen letter.
            $titles = $wpdb->get_col( $wpdb->prepare( "
                SELECT ID FROM $wpdb->posts
                WHERE post_title LIKE '%s'
                AND post_title LIKE '%%%s%%'
                AND post_type = 'artist'
                AND post_status = 'publish'
            ", $letter.'%', $search_query ) );
        }

        if(!empty($titles)) {
            $args['post__in'] = $titles;
        } else {
            wp_send_json_error( 'Results not found');
        }

        if(!empty($categories)) {
            ob_start();
            foreach ($categories as $parent_category):
                $parent_category_object = get_term_by('slug', $parent_category, 'talentcategory');
                $parent_category_id = $parent_category_object->term_id;
                $roles_to_show = get_terms([ 'taxonomy' => 'talentcategory', 'hide_empty' => true, 'parent' => $parent_category_id ]);

                foreach ($roles_to_show as $role) :
                    if(!empty($roles)) {
                        $is_checked = in_array($role->slug, $roles);
                    } else $is_checked = false; ?>
                    <li class="control checkbox">
                        <input id="<?php echo $role->slug; ?>" type="checkbox" data-filter-name="roles" data-parent-category="<?php echo $parent_category_object->slug; ?>" data-label="<?php echo $role->name; ?> (<?php echo $parent_category_object->name; ?>)" value="<?php echo $role->slug; ?>" <?php echo $is_checked ? 'checked' : ''; ?>>
                        <label for="<?php echo $role->slug; ?>" class="booking-nd__filter-label js-flabel"><?php echo $role->name; ?> (<?php echo $parent_category_object->name; ?>)</label>
                    </li>
                <?php endforeach; ?>
            <?php endforeach;

            $roles_output = ob_get_clean();

            if(empty($roles)) {
                $additional_category_args = [
                    'taxonomy' => 'talentcategory',
                    'field' => 'slug',
                    'terms' => $categories
                ];

                $args['tax_query'][1][] = $additional_category_args;
            }
        }

        if(!empty($roles)) {
            $additional_subcategory_args = [
                'taxonomy' => 'talentcategory',
                'field' => 'slug',
                'terms' => $roles
            ];

            $args['tax_query'][1][] = $additional_subcategory_args;
        }


        if(!empty($age)) {
            foreach ($age as $value) {
                $age_range = explode('-', $value);

                $additional_age_args = [
                    'key' => 'talent_age',
                    'value' => $age_range,
                    'compare' => 'BETWEEN'
                ];
                $args = array_merge_recursive($args, ['meta_query' => [$additional_age_args]]);
            }
        }

        if(!empty($followersInstagram)) {
            foreach ($followersInstagram as $value) {
                $additional_followersInst_args = [
                    'taxonomy' => 'followersInstagram',
                    'field' => 'slug',
                    'terms' => $value
                ];
                $args['tax_query'][1][] = $additional_followersInst_args;
            }
        }

        if(!empty($followersTiktok)) {
            foreach ($followersTiktok as $value) {
                $additional_followersTt_args = [
                    'taxonomy' => 'followersTiktok',
                    'field' => 'slug',
                    'terms' => $value
                ];
                $args['tax_query'][1][] = $additional_followersTt_args;
            }
        }

        if(!empty($followersFb)) {
            foreach ($followersFb as $value) {
                $additional_followersFb_args = [
                    'taxonomy' => 'followersFb',
                    'field' => 'slug',
                    'terms' => $value
                ];
                $args['tax_query'][1][] = $additional_followersFb_args;
            }
        }

        if(!empty($gender)) {
            foreach ($gender as $value) {
                $additional_gender_args = [
                    'key' => 'gender',
                    'value' => $value,
                    'compare' => '='
                ];
                $args = array_merge_recursive($args, ['meta_query' => [$additional_gender_args]]);
            }
        }

        if(!empty($nationality)) {
            foreach ($nationality as $value) {
                $additional_nationality_args = [
                    'key' => 'origin_countries',
                    'value' => $value,
                    'compare' => '='
                ];
                $args = array_merge_recursive($args, ['meta_query' => [$additional_nationality_args]]);
            }
        }

        $search_query = new WP_Query( $args );

        $artists_in_shortlist = $_COOKIE['video_messaging'];

        if ( $search_query->have_posts() ) {
            $posts = array();
            while ( $search_query->have_posts() ) {
                $search_query->the_post();
                $post_id = get_the_ID();
                $post_title = get_the_title();
                $post_permalink = get_permalink();
                $post_thumbnail = get_the_post_thumbnail_url( $post_id );
                $is_in_shortlist = false;
                $category_to_display = wp_get_post_terms($post_id, 'talentcategory', ['fields' => 'names'])[0];

                if(strpos($artists_in_shortlist, $post_id) !== false) {
                    $is_in_shortlist = true;
                }

                $post = array(
                    'id' => $post_id,
                    'title' => $post_title,
                    'permalink' => $post_permalink,
                    'thumbnail' => $post_thumbnail,
                    'is_in_shortlist' => $is_in_shortlist,
                    'category_to_display' => $category_to_display
                );
                $posts[] = $post;
            }

            wp_send_json_success([
                'posts' => $posts,
                'current_page' => $page,
                'max_num_pages' => $search_query->max_num_pages,
                'roles_output' => $roles_output,
                'args' => $args
            ] );
        } else {
            wp_send_json_error( 'Results not found');
        }

        wp_reset_postdata();
        die();
    }
