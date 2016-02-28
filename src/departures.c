#include <pebble.h>

static Window *window;
static TextLayer *text_layer;
static ScrollLayer *scroll_layer;

static ScrollLayer *s_scroll_layer;
static TextLayer *s_text_layer;

static GBitmap *s_bitmap;
static BitmapLayer *s_bitmap_layer;

#define apidata 0

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
  // Destroy loading image layer.
  bitmap_layer_destroy(s_bitmap_layer);

  // Store incoming information
  static char departure_buffer[400];

  // Read tuples for data
  Tuple *departure_tuple = dict_find(iterator, apidata);

  // If all data is available, use it
  if(departure_tuple) {
    snprintf(departure_buffer, sizeof(departure_buffer), "%s", departure_tuple->value->cstring);
  }

  text_layer_set_text(s_text_layer, departure_buffer);
  text_layer_set_font(s_text_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  scroll_layer_set_content_size(s_scroll_layer, text_layer_get_content_size(s_text_layer));
}

static void handle_init() {
  Window *window = window_create();
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  s_scroll_layer = scroll_layer_create(bounds);
  scroll_layer_set_click_config_onto_window(s_scroll_layer, window);
  layer_add_child(window_layer, scroll_layer_get_layer(s_scroll_layer));

  // Show loading screen.
  s_text_layer = text_layer_create(GRect(bounds.origin.x, bounds.origin.y, bounds.size.w, 2000));
  text_layer_set_text(s_text_layer, "\nLoading");
  text_layer_set_background_color(s_text_layer, GColorFromRGB(0, 0, 85));
  text_layer_set_text_color(s_text_layer, GColorFromRGB(255, 255, 255));
  text_layer_set_text_alignment(s_text_layer, GTextAlignmentCenter);
  text_layer_set_font(s_text_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  scroll_layer_add_child(s_scroll_layer, text_layer_get_layer(s_text_layer));
  scroll_layer_set_content_size(s_scroll_layer, text_layer_get_content_size(s_text_layer));

  // Display app image.
  s_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MENU_ICON);
  s_bitmap_layer = bitmap_layer_create(bounds);
  bitmap_layer_set_bitmap(s_bitmap_layer, s_bitmap);
  bitmap_layer_set_compositing_mode(s_bitmap_layer, GCompOpSet);
  layer_add_child(window_layer, bitmap_layer_get_layer(s_bitmap_layer));

  // Must be after added to the view hierachy
  text_layer_enable_screen_text_flow_and_paging(s_text_layer, 2);

  // Enable ScrollLayer paging
  scroll_layer_set_paging(s_scroll_layer, true);

  window_stack_push(window, true);

  // Register callbacks
  app_message_register_inbox_received(inbox_received_callback);

  // Open AppMessage
  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());
}

void handle_deinit(void) {
  // Destroy the text layer
  text_layer_destroy(text_layer);

  // Destroy scroll layer
  scroll_layer_destroy(scroll_layer);

  // Destroy the window
  window_destroy(window);
}

int main(void) {
  handle_init();
  app_event_loop();
  handle_deinit();
}
