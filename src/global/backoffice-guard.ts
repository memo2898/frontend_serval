import { checkIfLogin, checkHasContext, checkMustChangePassword } from './guards_auth';

checkIfLogin();
checkHasContext();
checkMustChangePassword();
