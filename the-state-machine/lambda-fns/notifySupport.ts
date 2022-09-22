exports.handler = async function(err:any) {
  //sipmly mails off errors to support no matter what the issue is.
  let email = formatSES(err);
  await sendMail();

  return true;
}

function formatSES(err: any) {

}

async function sendMail() {

}