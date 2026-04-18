<?php

namespace App\Http\Controllers;

use App\Models\Passkey;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AuthenticatorAttestationResponse;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialParameters;
use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialSource;
use Webauthn\PublicKeyCredentialUserEntity;

class PasskeyController extends Controller
{
    public function registerOptions(Request $request)
    {
        $user = $request->user();
        $rpEntity = PublicKeyCredentialRpEntity::create(
            name: config('app.name', 'muu-cms'),
            id: $request->getHost(),
        );
        $userEntity = PublicKeyCredentialUserEntity::create(
            name: $user->name,
            id: (string) $user->id,
            displayName: $user->name,
        );

        $challenge = random_bytes(32);

        $options = PublicKeyCredentialCreationOptions::create(
            rp: $rpEntity,
            user: $userEntity,
            challenge: $challenge,
            pubKeyCredParams: [
                PublicKeyCredentialParameters::createPk(-7),   // ES256
                PublicKeyCredentialParameters::createPk(-257),  // RS256
            ],
        );

        $request->session()->put('webauthn.creation_options', serialize($options));

        return response()->json($this->serializeCreationOptions($options));
    }

    public function register(Request $request)
    {
        $optionsSerialized = $request->session()->pull('webauthn.creation_options');
        if (!$optionsSerialized) {
            return response()->json(['message' => 'Challenge not found'], 400);
        }

        $options = unserialize($optionsSerialized);

        $attestationStatementSupportManager = AttestationStatementSupportManager::create();
        $factory = new CeremonyStepManagerFactory();
        $factory->setAttestationStatementSupportManager($attestationStatementSupportManager);
        $ceremonyStepManager = $factory->creationCeremony();

        $validator = AuthenticatorAttestationResponseValidator::create($ceremonyStepManager);

        $serializerFactory = new WebauthnSerializerFactory($attestationStatementSupportManager);
        $serializer = $serializerFactory->create();

        $publicKeyCredential = $serializer->deserialize(
            $request->getContent(),
            PublicKeyCredential::class,
            'json',
        );

        $authenticatorAttestationResponse = $publicKeyCredential->response;
        if (!$authenticatorAttestationResponse instanceof AuthenticatorAttestationResponse) {
            return response()->json(['message' => 'Invalid response type'], 400);
        }

        $credentialSource = $validator->check(
            $authenticatorAttestationResponse,
            $options,
            $request->getHost(),
        );

        Passkey::create([
            'user_id' => $request->user()->id,
            'credential_id' => base64_encode($credentialSource->publicKeyCredentialId),
            'public_key' => base64_encode(serialize($credentialSource)),
            'sign_count' => $credentialSource->counter,
        ]);

        return redirect('/');
    }

    public function authenticateOptions(Request $request)
    {
        $challenge = random_bytes(32);

        $options = PublicKeyCredentialRequestOptions::create(
            challenge: $challenge,
            rpId: $request->getHost(),
        );

        $request->session()->put('webauthn.request_options', serialize($options));

        return response()->json([
            'challenge' => base64url_encode($challenge),
            'rpId' => $request->getHost(),
            'timeout' => 60000,
            'userVerification' => 'preferred',
        ]);
    }

    public function authenticate(Request $request)
    {
        $optionsSerialized = $request->session()->pull('webauthn.request_options');
        if (!$optionsSerialized) {
            return response()->json(['message' => 'Challenge not found'], 400);
        }

        $options = unserialize($optionsSerialized);

        $attestationStatementSupportManager = AttestationStatementSupportManager::create();
        $serializerFactory = new WebauthnSerializerFactory($attestationStatementSupportManager);
        $serializer = $serializerFactory->create();

        $publicKeyCredential = $serializer->deserialize(
            $request->getContent(),
            PublicKeyCredential::class,
            'json',
        );

        $authenticatorAssertionResponse = $publicKeyCredential->response;
        if (!$authenticatorAssertionResponse instanceof AuthenticatorAssertionResponse) {
            return response()->json(['message' => 'Invalid response type'], 400);
        }

        $credentialId = base64_encode($publicKeyCredential->rawId);
        $passkey = Passkey::where('credential_id', $credentialId)->first();

        if (!$passkey) {
            return response()->json(['message' => 'Credential not found'], 400);
        }

        $credentialSource = unserialize(base64_decode($passkey->public_key));

        $factory = new CeremonyStepManagerFactory();
        $factory->setAttestationStatementSupportManager($attestationStatementSupportManager);
        $ceremonyStepManager = $factory->requestCeremony();

        $validator = AuthenticatorAssertionResponseValidator::create($ceremonyStepManager);

        $updatedSource = $validator->check(
            $credentialSource,
            $authenticatorAssertionResponse,
            $options,
            $request->getHost(),
            $credentialSource->userHandle,
        );

        $passkey->update(['sign_count' => $updatedSource->counter]);

        Auth::login($passkey->user);
        $request->session()->regenerate();

        return redirect('/');
    }

    private function serializeCreationOptions(PublicKeyCredentialCreationOptions $options): array
    {
        return [
            'rp' => [
                'name' => $options->rp->name,
                'id' => $options->rp->id,
            ],
            'user' => [
                'id' => base64url_encode($options->user->id),
                'name' => $options->user->name,
                'displayName' => $options->user->displayName,
            ],
            'challenge' => base64url_encode($options->challenge),
            'pubKeyCredParams' => array_map(fn ($p) => [
                'type' => $p->type,
                'alg' => $p->alg,
            ], $options->pubKeyCredParams),
            'timeout' => 60000,
            'attestation' => 'none',
        ];
    }
}

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
