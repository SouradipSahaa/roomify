import {useLocation, useNavigate, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, getProject} from "../../lib/puter.action";
const VisualizerId = () => {

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { initialImage, initialRender, name } = (location.state || {}) as VisualizerLocationState;
    const hasInitialGenerated = useRef(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [project, setProject] = useState<DesignItem | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(initialRender || null);

    const handleBack = () => navigate('/');

    const runGeneration= async (sourceImage: string)=>{
        try{
            setIsProcessing(true);
            const result = await generate3DView({sourceImage});

            if(result.renderedImage){
                setCurrentImage(result.renderedImage);
                const updatedProject = {
                    ...(project || {
                        id: id || Date.now().toString(),
                        name: name || "Untitled Project",
                        sourceImage,
                        timestamp: Date.now(),
                    }),
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                };

                const savedProject = await createProject({ item: updatedProject });
                if (savedProject) setProject(savedProject);
            }
        } catch(error){
            console.error('generation failed', error)
        } finally{
            setIsProcessing(false);
        }
    }


    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) return;
            const loadedProject = await getProject({ id });
            if (!isMounted || !loadedProject) return;
            setProject(loadedProject);
            setCurrentImage(loadedProject.renderedImage || initialRender || null);
        };

        if (initialImage) {
            setProject({
                id: id || Date.now().toString(),
                name,
                sourceImage: initialImage,
                renderedImage: initialRender || null,
                timestamp: Date.now(),
            });
        } else {
            loadProject();
        }

        return () => {
            isMounted = false;
        };
    },[id, initialImage, initialRender, name]);

    useEffect(() => {
        const sourceImage = project?.sourceImage || initialImage;
        if(!sourceImage || hasInitialGenerated.current) return;
        if(project?.renderedImage || initialRender){
            setCurrentImage(project?.renderedImage || initialRender || null);
            hasInitialGenerated.current = true;
            return;
        }
        hasInitialGenerated.current = true;
        runGeneration(sourceImage);
    },[project, initialImage, initialRender]);

    return(


             <div className="visualizer">
                 <nav className="topbar">
                     <div className="brand">
                         <Box className="logo" />

                         <span className="name">Roomify</span>
                     </div>
                     <Button variant="ghost" size="sm" onClick={handleBack}
                             className="exit">
                         <X className="icon" /> Exit Editor
                     </Button>
                 </nav>

                 <section className="content">
                     <div className="panel">
                     <div className="panel-header">
                         <div className="panel-meta">
                             <p>Project</p>
                             <h2>{project?.name || name || 'Untitled Project'}</h2>
                             <p className="note"> Created by You</p>
                         </div>
                         <div className="panel-actions">
                             <Button
                                 size="sm"
                                 onClick={()=>{}}
                                 className="export"
                                 disabled={!currentImage}
                             >
                                 <Download className="w-4 h-4 mr-2" /> Export
                             </Button>
                             <Button size="sm" onClick={() => {}} className="share">
                                 <Share2 className="w-4 h-4 mr-2" />
                                 Share
                             </Button>
                         </div>
                     </div>

                         <div className={`render-area ${isProcessing ? 'processing' : ''}`}>
                             {currentImage ? (
                                 <img src={currentImage} alt="AI Render"
                                     className="render-img"/>
                             ):(
                                 <div className="render-placeholder">
                                     {(project?.sourceImage || initialImage) && (
                                         <img src={project?.sourceImage || initialImage} alt="Original"
                                              className="render-fallback"/>
                                     )}
                                 </div>
                             )}
                             {isProcessing && (
                                 <div className="render-overlay">
                                     <div className="rendering-card">
                                         <RefreshCcw className="spinner"/>
                                         <span className="title"> Rendering...</span>
                                         <span className="subtitle">Generating your 3D visualization</span>
                                     </div>
                                 </div>
                             )}
                         </div>

                     </div>
                 </section>

            </div>

    )}

export default VisualizerId;
