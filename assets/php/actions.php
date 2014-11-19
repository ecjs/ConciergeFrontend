<?php
/*
 * This script:
 * For PHP 5 >= 5.2.0 and suppoort PDO
 * Takes the Ajax requests
 * Save e-mail addresses in a CSV, MySql, Mailchimp, GetResponse, AWeber
*/

require_once('api_mailchimp/MailChimp.php');
require_once('api_getresponse/GetResponseAPI.class.php');
require_once('api_aweber/aweber_api.php');

/* Options ************************************/
	
/* MySql setting. */
define('DB_HOST', 'localhost');
define('DB_NAME', '');
define('DB_USER', ''); 
define('DB_PASS', '');
define('DB_TABLE_NAME', 's_subs');

/* Mailchimp setting. */
define('MC_APIKEY', ''); //Your API key from here - http://admin.mailchimp.com/account/api
define('MC_LISTID', ''); //List unique id from here - http://admin.mailchimp.com/lists/

/* GetResponse setting. */
define('GR_APIKEY', ''); //Your API key from here - https://app.getresponse.com/my_api_key.html
define('GR_CAMPAIGN', ''); //Campaign name from here - https://app.getresponse.com/campaign_list.html

/* AWeber setting. */
define('AW_AUTHCODE', ''); //Your Authcode from here - https://auth.aweber.com/1.0/oauth/authorize_app/4ac86d98
define('AW_LISTNAME', ''); //List name from here - https://www.aweber.com/users/autoresponder/manage

/* CSV file setting */
define('FL_MAIL', '../../mails_0000000.csv');

/* File error log */
define('ERROR_LOG', '../../error_log.txt');

/* End Options ********************************/




/* Install headers */
header('Expires: 0');
header('Cache-Control: no-cache, must-revalidate, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Content-Type: application/json; charset=utf-8');

/* AJAX check */
if(!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
   
	extract($_POST);
	
	try {
			
		if(isset($subscribe) && validMail($subscribe)){ // Save emails	
			saveFile($subscribe, $name);
			saveMySql($subscribe, $name);
			saveMailChimp($subscribe, $name);
			saveAWeber($subscribe, $name);
			saveGetResponse($subscribe, $name);
		}else{
			throw new Exception("Email not valid", 1);
		}
		
	} catch(Exception $e) {
		$code = $e->getCode();
	}
	
	echo $code ? $code : 0;

} else {
	echo 'Only Ajax request';
} 


function saveMySql($subscribe, $name=null)
{
	if(DB_HOST && DB_NAME && DB_USER && DB_PASS && DB_TABLE_NAME){
		try {
			$db = new PDO('mysql:host='. DB_HOST .';dbname='. DB_NAME, DB_USER, DB_PASS);
		} catch(Exception $e) {
			errorLog("MySql",$e->getMessage());
		}
		
		$db->exec('CREATE TABLE IF NOT EXISTS '. DB_TABLE_NAME .' (name VARCHAR(255), email VARCHAR(255), time VARCHAR(255))');
		
		$query = $db->prepare('SELECT COUNT(*) AS count FROM '.DB_TABLE_NAME.' WHERE email = :email');  
		$query->execute(array(':email' => $subscribe));
		$result = $query->fetch();
		
		if($result['count'] == 0){
			$query = $db->prepare('INSERT INTO '. DB_TABLE_NAME .' (name, email, time) VALUES (:name, :email, :time)');  
			$query->execute(array('name'=>getName($subscribe, $name), 'email' => $subscribe, 'time' => date('Y-m-d H:i:s')));	
		} else {
			throw new Exception("Email exist", 2);
		}
	}
}

function saveMailChimp($subscribe, $name=null)
{
	if(MC_APIKEY && MC_LISTID){
		
		$MailChimp = new MailChimp(MC_APIKEY);
		$result = $MailChimp->call('lists/subscribe', array(
			'id'                => MC_LISTID,
			'email'             => array('email' => $subscribe),
			'merge_vars'        => array('FNAME' => getName($subscribe, $name)),
			'double_optin'      => false,
			'send_welcome'      => false,
		));
		if(isset($result['code'])){
			if($result['code'] == 214){
				throw new Exception("Email exist", 2);
			} else {
				errorLog("MailChimp","[". $result['code'] ."] ". $result['error'] );
			}
		}
	}
}

function saveFile($subscribe, $name=null)
{
	if(FL_MAIL){
		file_put_contents(FL_MAIL, date("m.d.Y H:i:s") .";". getName($subscribe, $name) .";". $subscribe .";\n", FILE_APPEND);
	}
}

function saveGetResponse($subscribe, $name=null)
{
	if(GR_APIKEY && GR_CAMPAIGN){
		$api = new GetResponse(GR_APIKEY);
		$campaign = $api->getCampaignByName(GR_CAMPAIGN);
		$subscribe = $api->addContact($campaign, getName($subscribe, $name), $subscribe);
		if(array_key_exists('duplicated', $subscribe)){
			throw new Exception("Email exist", 2);
		}
	}
}

function saveAWeber($subscribe, $name=null)
{
	if(AW_AUTHCODE && AW_LISTNAME){
		$token = 'api_aweber/'. substr(AW_AUTHCODE, 0, 10);
		
		if(!file_exists($token)){
			try {
				$auth = AWeberAPI::getDataFromAweberID(AW_AUTHCODE);
				file_put_contents($token, json_encode($auth));
			} catch(AWeberAPIException $exc) {
				errorLog("AWeber","[". $exc->type ."] ". $exc->message ." Docs: ". $exc->documentation_url);
				throw new Exception("Authorization error", 5);
			}  
		}
		
		if(file_exists($token)){
			$key = file_get_contents($token);
		}
		list($consumerKey, $consumerSecret, $accessToken, $accessSecret) = json_decode($key);
		
		$aweber = new AWeberAPI($consumerKey, $consumerSecret);
		try {
			$account = $aweber->getAccount($accessToken, $accessSecret);
			$foundLists = $account->lists->find(array('name' => AW_LISTNAME));
			$lists = $foundLists[0];
			
			$params = array(
				'email' => $subscribe,
				'name' => getName($subscribe, $name)
			);
			
			if(isset($lists)){
				$lists->subscribers->create($params);
			} else{
				errorLog("AWeber","List is not found");
				throw new Exception("Error found Lists", 4);
			}
		} catch(AWeberAPIException $exc) {
			if($exc->status == 400){
				throw new Exception("Email exist", 2);
			}else{
				errorLog("AWeber","[".$exc->type."] ". $exc->message ." Docs: ". $exc->documentation_url);
			}
		}
	}
}

function validMail($email)
{
	if(filter_var($email, FILTER_VALIDATE_EMAIL)){
		return true;
	} else {
		return false;
	}
}

function errorLog($name, $desc)
{
	file_put_contents(ERROR_LOG, date("d.m.Y H:i:s") ." (". $name .") ". $desc ."\n", FILE_APPEND);
}

function getName($mail, $name=null)
{
	if($name != null){
		return $name;
	} else {
		preg_match("/([a-zA-Z0-9._-]*)@[a-zA-Z0-9._-]*$/", $mail, $matches);
		return $matches[1];
	}
}

?>