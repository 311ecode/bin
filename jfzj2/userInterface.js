import blessed from 'blessed';
import { inspect } from 'util';

export const createInterface = (searchFunction, debugFunction) => {

  
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Real-time File Search'
  });

  const inputBox = blessed.textbox({
    parent: screen,
    top: 0,
    left: 0,
    height: 3,
    width: '100%',
    border: {
      type: 'line'
    },
    focus: true,
    inputOnFocus: true
  });

  const resultList = blessed.list({
    parent: screen,
    top: 3,
    left: 0,
    height: '100%-3',
    width: '100%',
    border: {
      type: 'line'
    },
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    style: {
      selected: {
        bg: 'blue'
      }
    }
  });
  
  const debugBox = blessed.log({
    parent: screen,
    bottom: 0,
    right: 0,
    width: '50%',
    height: '30%',
    border: {
      type: 'line'
    },
    label: 'Debug Info',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true
  });

  const debug = (message) => {
    try {
      let formattedMessage;
      if (typeof message === 'string') {
        formattedMessage = message;
      } else {
        formattedMessage = inspect(message, { depth: null, colors: true });
      }
      debugBox.log(formattedMessage);
      screen.render();
    } catch (error) {
      console.error('Error in debug function:', error);
    }
  };
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

  let currentSearchTerm = '';

  const handleSearch = async (value) => {
    try {
      resultList.setItems(['Searching...']);
      screen.render();

      debug(`Searching for "${value}"`);
      const results = await searchFunction(value);
      debug(`Found ${results.length} results for "${value}"`);
      
      if (results.length === 0) {
        resultList.setItems(['No results found']);
      } else {
        const formattedResults = results.map(result => {
          if (typeof result === 'string') {
            return result;
          } else {
            return inspect(result, { depth: null, colors: false });
          }
        });
        resultList.setItems(formattedResults);
        resultList.select(0);
      }
      
      screen.render();
    } catch (error) {
      debug(`Error during search: ${error}`);
      resultList.setItems(['Error occurred during search']);
      screen.render();
    }
  };

  inputBox.on('keypress', async (ch, key) => {
    if (['down', 'up', 'enter', 'left', 'right', 'enter'].includes(key.name)) {
      resultList.emit('keypress', ch, key);
    } else {
      if (key.name === 'backspace') {
        currentSearchTerm = currentSearchTerm.slice(0, -1);
      } else {
        // Add the character to the current search term but remove any line breaks.
        currentSearchTerm = inputBox.getValue().replace(/\r?\n|\r/g, ''); + (ch || '');
      }
      debug(`Current search term: "${currentSearchTerm}"`);
      
      try {
        await handleSearch(currentSearchTerm);
      } catch (error) {
        debug(`Error in search: ${error}`);
      }
    }
  });

  resultList.key(['down', 'up'], (ch, key) => {
    if (key.name === 'down') {
      resultList.down();
    } else if (key.name === 'up') {
      resultList.up();
    }
    screen.render();
  });

  resultList.key('enter', () => {
    debug('Enter key pressed on result list');
    const selected = resultList.selected;
    if (selected !== undefined) {
      const selectedItem = resultList.getItem(selected);
      debug(`Selected: ${selectedItem.content}`);
      // Here you can implement the action to open the selected file or commit
    }
  });

  screen.render();
  inputBox.focus();

  return { screen, inputBox, resultList, debug };
};