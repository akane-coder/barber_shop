// Объявления для CSS модулей и глобальных стилей
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Для глобальных CSS файлов (импорт с побочным эффектом)
declare module '*.css' {
  export default any;
}