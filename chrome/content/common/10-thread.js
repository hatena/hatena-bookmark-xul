
// (function() {
//   p('loaded');
//   // var Thread = function {
//   //     return ThreadManager.newThread(0);
//   // };
//  let fib = (function() {
//      let i = 0, j = 0;
//      return function() {
//          p(i);
//          let t = i;
//          i = j;
//          j += t;
//      }
//  })();
// 
// 
//   let t = ThreadManager.newThread(0);
//   let m = ThreadManager.mainThread;
//   do
//   {
//       m.processNextEvent(true);
//       fib();
//   }
//   while (m.hasPendingEvents());
// 
// })();


