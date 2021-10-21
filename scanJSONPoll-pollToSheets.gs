/***********************
* GOOGLE SHEETS TARGET *
************************/
const sheetID = "ID_GOOGLE_SHEETS";
const sheetFile = SpreadsheetApp.openById( sheetID );


/***************************
* JSON POLL ANSWER SAMPLES *
****************************/
const jsonPollUserbased = {
    "update_id": 603402545,
    "poll_answer": {
        "poll_id": "6301080145537007634",
        "user": {
            "id": 1821266651,
            "is_bot": false,
            "first_name": "RSUD CIBABAT",
            "last_name": "CIMAHI",
            "username": "rscibabat",
            "language_code": "en"
        },
        "option_ids": [0,2]
    }
};
const jsonPollAnonymous = {
    "update_id": 603402549,
    "poll": {
        "id": "6301080145537007639",
        "question": "[1821266651] Your favorite color",
        "options": [
            {
                "text": "RED",
                "voter_count": 0
            },
            {
                "text": "GREEN",
                "voter_count": 0
            },
            {
                "text": "BLUE",
                "voter_count": 1
            }
        ],
        "total_voter_count": 1,
        "is_closed": false,
        "is_anonymous": true,
        "type": "regular",
        "allows_multiple_answers": false
    }
};


/****************
* LET'S TEST IT *
*****************/
function testOnly(){
  
  Logger.log( scanJSONPoll( jsonPollUserbased.poll_answer ) );
  Logger.log( scanJSONPoll( jsonPollAnonymous.poll ) );
  
  pollToSheets( scanJSONPoll( jsonPollUserbased.poll_answer ), "USER-BASED" );
  pollToSheets( scanJSONPoll( jsonPollAnonymous.poll ), "ANONYMOUS" );
  
}


/***************************************************************************************************
* FUNGSI PEMINDAI KEYS DAN VALUE KIRIMAN JSON POLL TELEGRAM *
* https://telegram-bot-script.blogspot.com/2021/10/json-poll-answer-telegram-dengan-apps-script.html
****************************************************************************************************/
function scanJSONPoll( obj ) {
  
  let data = [];
  let keys = [];
  let values = [];
  
  for ( var key in obj ) {
    
    /*********************************************
    * PENANGANAN PROPERTI BERBENTUK NON OBJECT *
    * https://stackoverflow.com/a/4775737/12682081
    **********************************************/
    if ( Object.prototype.toString.call( obj[key] ) !== "[object Object]" ) { 
      
      /**************************************
      * PENANGANAN PROPERTI BERBENTUK ARRAY *
      * seperti options dan options_ids
      ***************************************/
      if ( Array.isArray( obj[key] ) ) {
        
        /***************************************************
        * PENANGANAN PROPERTI BERBENTUK ARRAY BERISI NILAI *
        * "options_ids": [0,1,2,...]
        ****************************************************/
        if ( Object.prototype.toString.call( obj[key][0] ) === "[object Number]" ){
          
          keys.push( key );

          let jawaban = "";
          for ( let i=0; i < obj[key].length; i++ ) {
            jawaban += jawabanPilihan[ obj[key][i] ];
            jawaban += i < obj[key].length - 1 ? "-" : "";
          }
          values.push( jawaban );


        /***********************************************************
        * PENANGANAN PROPERTI BERBENTUK ARRAY BERISI OBJECT *
        * "options": [ {"text":"RED","voter_count": 0}, {...}, ... ]
        ************************************************************/
        } else {
          
          for ( let i=0; i < obj[key].length; i++ ) {
            keys.push( Object.values( obj[key][i] )[0] );
            values.push( String( Object.values( obj[key][i] )[1] ) );
          }

        }

      
      /*************************************************************
      * PENANGANAN PROPERTI NON ARRAY NON OBJECT YANG BERISI NILAI *
      * seperti "poll_id": "6301080145537007638"
      **************************************************************/
      } else {
        
        keys.push( key );
        values.push( String( obj[key] ) );

      }

    
    /*********************************************************
    * PENANGANAN PROPERTI BERBENTUK OBJECT *
    * seperti "user": { "id":1821266651, "is_bot":false, ... }
    **********************************************************/
    } else if ( Object.prototype.toString.call( obj[key] ) === "[object Object]" ) {
      
      for ( let property in obj[key] ) {
        keys.push( property );
        values.push( String( obj[key][property] ) );
      }

    /**************************************************************************
    * PENANGANAN PROPERTI BERISI NILAI YANG BERADA DI DALAM ARRAY ATAU OBJECT *
    ***************************************************************************/
    } else {
      
      let subkeys = scanJSONPoll( obj[key] );
      
      keys = keys.concat(
        subkeys.map(
          function( subkey ) {
            return subkey;
          }
        )
      );

    }

  }

  data.push( keys, values );
  return data;

}


/*****************************************************************************************************
* FUNGSI MENYIMPAN KIRIMAN JAWABAN POLL KE GOOGLE SHEETS *
* https://telegram-bot-script.blogspot.com/2021/10/menyimpan-hasil-poll-telegram-ke-google-sheets.html
******************************************************************************************************
* pollData = array dua dimensi contoh: 
[
  [poll_id, id, is_bot, first_name, last_name, username, language_code, option_ids],
  [6301080145537007634, 1821266651, false, RSUD CIBABAT, CIMAHI, rscibabat, en, RED-BLUE]
]
* pollSheet = string nama sheet target
* contoh eksekusi melibatkan fungsi scanJSONPoll:
pollToSheets( scanJSONPoll( JSON.parse( e.postData.contents ).[nama_properti_induk] ), [nama_sheet] );
pollToSheets( scanJSONPoll( data.poll_answer ), "USER-BASED" );
pollToSheets( scanJSONPoll( data.poll ), "ANONYMOUS" );
******************************************************************************************************/

function pollToSheets( pollData, pollSheet ) {
  
  const pollKeys = pollData[0];
  const pollValues = [ pollData[1] ];
  const sheetName = 
    sheetFile.getSheetByName( pollSheet ) ?
    sheetFile.getSheetByName( pollSheet ) :
    sheetFile.insertSheet( pollSheet );

  /*******************
  * CEK JUDUL HEADER * 
  ********************/
  if ( pollKeys.length > 0 ) {
    
    for ( let [index, element] of sheetName.getRange( 1, 1, 1, pollKeys.length ).getValues()[0].entries() ){
      if ( !element ) {
        sheetName.getRange( 1, index + 1 ).setValue( pollKeys[index] );
      }
    }

  }
  
  /************************
  * SIMPAN DATA KE SHEETS * 
  *************************/
  let sheetData = sheetName.getRange( sheetName.getLastRow() + 1, 1, 1, pollValues[0].length );
  sheetData.setValues( pollValues );

}
