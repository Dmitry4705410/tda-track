import { I18N } from '@gravity-ui/i18n';
import ru from './ru.json';
import en from './en.json';

export const i18n = new I18N({
  lang: 'ru',
  data: {
    ru: { app: ru },
    en: { app: en }
  }
});

export const t = i18n.keyset('app');
