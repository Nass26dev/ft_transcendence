import os
import sib_api_v3_sdk
from pathlib import Path
from dotenv import load_dotenv
from sib_api_v3_sdk.rest import ApiException



def send_2fa_email(email_destinataire, code_otp):

    configuration = sib_api_v3_sdk.Configuration()
    api_key = os.getenv('BREVO_API_KEY') 
    
    if not api_key:
        print("Erreur : La variable BREVO_API_KEY n'est pas trouvée dans le .env")
        return False

    configuration.api_key['api-key'] = api_key

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": email_destinataire}],
        template_id=1, 
        params={"OTP_CODE": code_otp}
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        print(f"Email envoyé avec succès à {email_destinataire}")
        return True
    except ApiException as e:
        print(f"Erreur Brevo : {e}")
        return False