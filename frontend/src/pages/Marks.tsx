import { MarksUpload } from '@/components/MarksUpload';

export default function Marks() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                    Upload Marks
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Enter and manage student marks for various assessments
                </p>
            </div>

            {/* Marks Upload Component */}
            <MarksUpload />
        </div>
    );
}
