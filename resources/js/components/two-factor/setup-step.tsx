import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { Check, Copy, Loader2 } from 'lucide-react';
import AlertError from '../alert-error';

interface SetupStepProps {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    buttonText: string;
    onNextStep: () => void;
    errors: string[];
}

export default function SetupStep({
    qrCodeSvg,
    manualSetupKey,
    buttonText,
    onNextStep,
    errors,
}: SetupStepProps) {
    const [copiedText, copy] = useClipboard();
    const IconComponent = copiedText === manualSetupKey ? Check : Copy;

    if (errors?.length) {
        return <AlertError errors={errors} />;
    }

    return (
        <>
            <div className="mx-auto flex max-w-md overflow-hidden">
                <div className="mx-auto aspect-square w-64 rounded-lg border border-border">
                    <div className="z-10 flex h-full w-full items-center justify-center p-5">
                        {qrCodeSvg ? (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: qrCodeSvg,
                                }}
                            />
                        ) : (
                            <Loader2 className="flex size-4 animate-spin" />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex w-full space-x-5">
                <Button className="w-full" onClick={onNextStep}>
                    {buttonText}
                </Button>
            </div>

            <div className="relative flex w-full items-center justify-center">
                <div className="absolute inset-0 top-1/2 h-px w-full bg-border" />
                <span className="relative bg-card px-2 py-1">
                    or, enter the code manually
                </span>
            </div>

            <div className="flex w-full space-x-2">
                <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-border">
                    {!manualSetupKey ? (
                        <div className="flex h-full w-full items-center justify-center bg-muted p-3">
                            <Loader2 className="size-4 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <input
                                type="text"
                                readOnly
                                value={manualSetupKey}
                                className="h-full w-full bg-background p-3 text-foreground outline-none"
                            />
                            <button
                                onClick={() => copy(manualSetupKey)}
                                className="border-l border-border px-3 hover:bg-muted"
                            >
                                <IconComponent className="w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
