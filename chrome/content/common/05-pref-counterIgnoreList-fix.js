const OLD_COUNTER_IGNORE_LIST =
    'extensions.hatenabookmark.statusbar.counterIngoreList';
const COUNTER_IGNORE_LIST =
    'extensions.hatenabookmark.statusbar.counterIgnoreList';

if (PrefService.prefHasUserValue(OLD_COUNTER_IGNORE_LIST)) {
    let value = PrefService.getCharPref(OLD_COUNTER_IGNORE_LIST);
    PrefService.setCharPref(COUNTER_IGNORE_LIST, value);
    PrefService.clearUserPref(OLD_COUNTER_IGNORE_LIST);
}
