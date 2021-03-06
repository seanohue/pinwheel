'use strict';

module.exports = srcPath => {
  const Broadcast = require(srcPath + 'Broadcast');

  return {
    usage: 'bug <description>',
    aliases: ['typo', 'suggestion'],
    command: state => (args, player, arg0) => {
      if (!args) {
        return Broadcast.sayAt(player, `<b><yellow>Please describe your ${arg0}.</yellow></b>`);
      }

      player.emit('bugReport', {
        description: args,
        type: arg0
      });

      // TODO: confirm report before sending, to prevent conflict with debug channel

      Broadcast.sayAt(player, `<b>Your ${arg0} report has been submitted as:</b>\n${args}`);
      Broadcast.sayAt(player, '<b>Thanks!</b>');
    }
  };
};